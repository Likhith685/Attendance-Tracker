import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Classroom, Student } from '../src/models/index.js';
import { sendAbsenceEmails } from '../src/services/email.service.js';
import {
  addStudents,
  api,
  createClassroom,
  registerStudent,
  registerTeacher,
  useTestDatabase,
} from './helpers.js';

vi.mock('../src/services/email.service.js', () => ({
  sendAbsenceEmails: vi.fn(async () => ({ sent: 0, failed: 0 })),
}));

useTestDatabase();

async function setup() {
  const teacher = await registerTeacher();
  const room = await createClassroom(teacher, { cname: 'Physics' });
  const students = await addStudents(teacher, room.id, [
    { name: 'Alice', roll: 1 },
    { name: 'Bob', roll: 2, attendance: 5 },
    { name: 'Cara', roll: 3 },
  ]);
  const save = (date, statuses) =>
    api()
      .put(`/api/classrooms/${room.id}/attendance/${date}`)
      .set(teacher.auth)
      .send({
        records: students.map((student, index) => ({
          studentId: student.id,
          status: statuses[index],
        })),
      });
  const attendanceOf = async () =>
    (await Student.find({ roomid: room.id }).sort({ roll: 1 }).lean()).map((s) => s.attendance);
  const daysOf = async () => (await Classroom.findById(room.id).lean()).days;
  return { teacher, room, students, save, attendanceOf, daysOf };
}

beforeEach(() => {
  vi.mocked(sendAbsenceEmails).mockClear();
});

describe('marking attendance', () => {
  it('creates a session and updates counters', async () => {
    const { save, attendanceOf, daysOf } = await setup();

    const res = await save('2025-01-10', ['Present', 'Absent', 'Present']).expect(201);
    expect(res.body.session).toEqual({
      date: '2025-01-10',
      created: true,
      presentCount: 2,
      totalCount: 3,
    });
    expect(await attendanceOf()).toEqual([1, 5, 1]);
    expect(await daysOf()).toBe(1);
  });

  it('applies only the changes when a session is edited', async () => {
    const { save, attendanceOf, daysOf } = await setup();
    await save('2025-01-10', ['Present', 'Absent', 'Present']).expect(201);

    const res = await save('2025-01-10', ['Absent', 'Present', 'Present']).expect(200);
    expect(res.body.session.created).toBe(false);
    expect(await attendanceOf()).toEqual([0, 6, 1]);
    expect(await daysOf()).toBe(1);

    // Re-saving the same statuses is a no-op.
    await save('2025-01-10', ['Absent', 'Present', 'Present']).expect(200);
    expect(await attendanceOf()).toEqual([0, 6, 1]);
  });

  it('counts each new date as a session', async () => {
    const { save, daysOf } = await setup();
    await save('2025-01-10', ['Present', 'Present', 'Present']).expect(201);
    await save('2025-01-11', ['Present', 'Present', 'Present']).expect(201);
    expect(await daysOf()).toBe(2);
  });

  it('never lets an attendance counter go negative', async () => {
    const { save, room, attendanceOf } = await setup();
    await save('2025-01-10', ['Present', 'Present', 'Present']).expect(201);
    await Student.updateMany({ roomid: room.id }, { $set: { attendance: 0 } });

    await save('2025-01-10', ['Absent', 'Absent', 'Absent']).expect(200);
    expect(await attendanceOf()).toEqual([0, 0, 0]);
  });

  it('keeps the existing status of students left out of the request', async () => {
    const { teacher, room, students, save } = await setup();
    await save('2025-01-10', ['Present', 'Present', 'Present']).expect(201);

    await api()
      .put(`/api/classrooms/${room.id}/attendance/2025-01-10`)
      .set(teacher.auth)
      .send({ records: [{ studentId: students[0].id, status: 'Absent' }] })
      .expect(200);

    const session = await api()
      .get(`/api/classrooms/${room.id}/attendance/2025-01-10`)
      .set(teacher.auth)
      .expect(200);
    expect(session.body.session.records.map((record) => record.status)).toEqual([
      'Absent',
      'Present',
      'Present',
    ]);
  });

  it('emails absent students who have an account', async () => {
    const { save } = await setup();
    await registerStudent(2, { email: 'bob@example.com', name: 'Bob Account' });

    await save('2025-01-10', ['Present', 'Absent', 'Absent']).expect(201);
    expect(sendAbsenceEmails).toHaveBeenCalledTimes(1);
    expect(sendAbsenceEmails).toHaveBeenCalledWith(
      [{ to: 'bob@example.com', studentName: 'Bob', roll: 2 }],
      { courseName: 'Physics', date: '2025-01-10' },
    );
  });

  it('only emails students who change from present to absent on edits', async () => {
    const { save } = await setup();
    await registerStudent(1, { email: 'alice@example.com' });
    await registerStudent(3, { email: 'cara@example.com' });
    await save('2025-01-10', ['Present', 'Absent', 'Absent']).expect(201);
    vi.mocked(sendAbsenceEmails).mockClear();

    await save('2025-01-10', ['Absent', 'Absent', 'Absent']).expect(200);
    const [recipients] = vi.mocked(sendAbsenceEmails).mock.calls[0];
    expect(recipients.map((recipient) => recipient.to)).toEqual(['alice@example.com']);
  });

  it('rejects future and invalid dates', async () => {
    const { save } = await setup();
    await save('2999-01-01', ['Present', 'Present', 'Present']).expect(400);
    await save('2025-02-30', ['Present', 'Present', 'Present']).expect(400);
  });

  it('validates the records payload', async () => {
    const { teacher, room, students } = await setup();
    const put = (body) =>
      api().put(`/api/classrooms/${room.id}/attendance/2025-01-10`).set(teacher.auth).send(body);

    await put({ records: [{ studentId: students[0].id, status: 'Late' }] }).expect(400);
    await put({ records: [{ studentId: 'nope', status: 'Present' }] }).expect(400);
    await put({
      records: [
        { studentId: students[0].id, status: 'Present' },
        { studentId: students[0].id, status: 'Absent' },
      ],
    }).expect(400);
  });
});

describe('reading attendance', () => {
  it('returns a session or 404 when the date is unmarked', async () => {
    const { teacher, room, students, save } = await setup();
    await save('2025-01-10', ['Present', 'Absent', 'Present']).expect(201);

    const res = await api()
      .get(`/api/classrooms/${room.id}/attendance/2025-01-10`)
      .set(teacher.auth)
      .expect(200);
    expect(res.body.session).toEqual({
      date: '2025-01-10',
      records: [
        { studentId: students[0].id, status: 'Present' },
        { studentId: students[1].id, status: 'Absent' },
        { studentId: students[2].id, status: 'Present' },
      ],
    });

    const missing = await api()
      .get(`/api/classrooms/${room.id}/attendance/2025-01-11`)
      .set(teacher.auth)
      .expect(404);
    expect(missing.body.code).toBe('SESSION_NOT_FOUND');
  });

  it('summarises sessions newest first', async () => {
    const { teacher, room, save } = await setup();
    await save('2025-01-10', ['Present', 'Absent', 'Present']).expect(201);
    await save('2025-01-12', ['Present', 'Present', 'Present']).expect(201);

    const res = await api()
      .get(`/api/classrooms/${room.id}/attendance`)
      .set(teacher.auth)
      .expect(200);
    expect(res.body.sessions).toEqual([
      { date: '2025-01-12', presentCount: 3, totalCount: 3 },
      { date: '2025-01-10', presentCount: 2, totalCount: 3 },
    ]);
  });
});
