import { describe, expect, it } from 'vitest';
import { AttendanceRecord, Classroom, Student } from '../src/models/index.js';
import {
  addStudents,
  api,
  createClassroom,
  registerStudent,
  registerTeacher,
  useTestDatabase,
} from './helpers.js';

useTestDatabase();

const CLASSROOM_LOCATION = { latitude: 22.5204, longitude: 75.9207 };
// Roughly 1.1 km north of the classroom.
const FAR_AWAY = { latitude: 22.5304, longitude: 75.9207 };
// Roughly 55 m north of the classroom.
const NEARBY = { latitude: 22.5209, longitude: 75.9207 };

async function setup({ location = false, date = '2025-03-01', rolls = [1, 2, 3] } = {}) {
  const teacher = await registerTeacher();
  const room = await createClassroom(teacher);
  await addStudents(
    teacher,
    room.id,
    rolls.map((roll) => ({ name: `Student ${roll}`, roll })),
  );
  const students = await Promise.all(rolls.map((roll) => registerStudent(roll)));

  const started = await api()
    .post(`/api/classrooms/${room.id}/check-in`)
    .set(teacher.auth)
    .send({ durationMinutes: 5, date, ...(location && CLASSROOM_LOCATION) })
    .expect(201);

  const checkIn = (student, body) =>
    api()
      .post(`/api/student/classrooms/${room.id}/check-in`)
      .set(student.auth)
      .send({ code: started.body.checkIn.code, ...body });

  return { teacher, room, students, checkIn, session: started.body.checkIn };
}

const attendanceOf = async (roomId, roll) =>
  (await Student.findOne({ roomid: roomId, roll }).lean()).attendance;

describe('starting and stopping a session', () => {
  it('returns a 6-digit PIN to the teacher only', async () => {
    const { teacher, room, students, session } = await setup({ location: true });
    expect(session).toMatchObject({
      active: true,
      code: expect.stringMatching(/^\d{6}$/),
      date: '2025-03-01',
      locationRequired: true,
    });

    const teacherView = await api().get(`/api/classrooms/${room.id}`).set(teacher.auth).expect(200);
    expect(teacherView.body.classroom.checkIn.code).toBe(session.code);

    const studentView = await api()
      .get(`/api/student/classrooms/${room.id}`)
      .set(students[0].auth)
      .expect(200);
    expect(studentView.body.classroom.checkIn).toEqual({
      active: true,
      expiresAt: session.expiresAt,
      date: '2025-03-01',
      locationRequired: true,
    });
  });

  it('validates the session options', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    const start = (body) =>
      api().post(`/api/classrooms/${room.id}/check-in`).set(teacher.auth).send(body);

    await start({ durationMinutes: 0 }).expect(400);
    await start({ durationMinutes: 120 }).expect(400);
    await start({ latitude: 10 }).expect(400);
    await start({ date: '2999-01-01' }).expect(400);
  });

  it('stops accepting check-ins once stopped', async () => {
    const { teacher, room, students, checkIn } = await setup();
    await api().delete(`/api/classrooms/${room.id}/check-in`).set(teacher.auth).expect(204);

    const res = await checkIn(students[0]).expect(400);
    expect(res.body.message).toMatch(/no active check-in/i);
    const view = await api().get(`/api/classrooms/${room.id}`).set(teacher.auth).expect(200);
    expect(view.body.classroom.checkIn.active).toBe(false);
  });
});

describe('student check-in', () => {
  it('marks the student present on the session date', async () => {
    const { room, students, checkIn } = await setup();

    const res = await checkIn(students[0]).expect(200);
    expect(res.body).toMatchObject({ date: '2025-03-01', alreadyCheckedIn: false });

    const record = await AttendanceRecord.findOne({ roomid: room.id, date: '2025-03-01' }).lean();
    expect(record.records.map((entry) => entry.status)).toEqual(['Present', 'Absent', 'Absent']);
    expect(await attendanceOf(room.id, 1)).toBe(1);
    expect((await Classroom.findById(room.id).lean()).days).toBe(1);
  });

  it('does not count a repeated check-in twice', async () => {
    const { room, students, checkIn } = await setup();
    await checkIn(students[0]).expect(200);

    const again = await checkIn(students[0]).expect(200);
    expect(again.body.alreadyCheckedIn).toBe(true);
    expect(await attendanceOf(room.id, 1)).toBe(1);
  });

  it('handles simultaneous check-ins without losing updates', async () => {
    const rolls = [1, 2, 3, 4, 5, 6];
    const { room, students, checkIn } = await setup({ rolls });

    await Promise.all(students.map((student) => checkIn(student).expect(200)));

    const records = await AttendanceRecord.find({ roomid: room.id }).lean();
    expect(records).toHaveLength(1);
    expect(records[0].records.every((entry) => entry.status === 'Present')).toBe(true);
    expect((await Classroom.findById(room.id).lean()).days).toBe(1);
    for (const roll of rolls) expect(await attendanceOf(room.id, roll)).toBe(1);
  });

  it('keeps counters consistent when the teacher edits a checked-in session', async () => {
    const { teacher, room, students, checkIn } = await setup();
    await checkIn(students[0]).expect(200);

    const roster = await api().get(`/api/classrooms/${room.id}/students`).set(teacher.auth);
    await api()
      .put(`/api/classrooms/${room.id}/attendance/2025-03-01`)
      .set(teacher.auth)
      .send({
        records: roster.body.students.map((student) => ({
          studentId: student.id,
          status: student.roll === 2 ? 'Present' : 'Absent',
        })),
      })
      .expect(200);

    expect(await attendanceOf(room.id, 1)).toBe(0);
    expect(await attendanceOf(room.id, 2)).toBe(1);
    expect((await Classroom.findById(room.id).lean()).days).toBe(1);
  });

  it('rejects a wrong PIN', async () => {
    const { room, students, session } = await setup();
    const wrong = session.code === '000000' ? '111111' : '000000';
    const res = await api()
      .post(`/api/student/classrooms/${room.id}/check-in`)
      .set(students[0].auth)
      .send({ code: wrong })
      .expect(400);
    expect(res.body.message).toMatch(/incorrect/i);

    await api()
      .post(`/api/student/classrooms/${room.id}/check-in`)
      .set(students[0].auth)
      .send({ code: '12ab' })
      .expect(400);
  });

  it('rejects expired sessions', async () => {
    const { room, students, checkIn } = await setup();
    await Classroom.updateOne({ _id: room.id }, { checkInExpiresAt: new Date(Date.now() - 1000) });

    const res = await checkIn(students[0]).expect(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('only accepts students enrolled in the classroom', async () => {
    const { room, checkIn } = await setup();
    const outsider = await registerStudent(999);

    await checkIn(outsider).expect(403);
    await api().get(`/api/student/classrooms/${room.id}`).set(outsider.auth).expect(404);
  });

  it('is not available to teachers', async () => {
    const { teacher, checkIn } = await setup();
    await checkIn(teacher).expect(403);
  });

  it('enforces the location radius when required', async () => {
    const { students, checkIn } = await setup({ location: true });

    const missing = await checkIn(students[0]).expect(400);
    expect(missing.body.message).toMatch(/location access is required/i);

    const far = await checkIn(students[0], FAR_AWAY).expect(400);
    expect(far.body.message).toMatch(/too far/i);

    await checkIn(students[0], NEARBY).expect(200);
  });
});
