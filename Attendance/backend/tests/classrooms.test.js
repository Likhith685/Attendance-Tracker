import { describe, expect, it } from 'vitest';
import { AttendanceRecord, Classroom, Student } from '../src/models/index.js';
import {
  addStudents,
  api,
  createClassroom,
  registerStudent,
  registerTeacher,
  today,
  useTestDatabase,
} from './helpers.js';

useTestDatabase();

describe('classroom management', () => {
  it('creates, lists, updates and deletes a classroom', async () => {
    const teacher = await registerTeacher();

    const created = await api()
      .post('/api/classrooms')
      .set(teacher.auth)
      .send({ cname: '  Data Structures ', ccode: 'CS201' })
      .expect(201);
    const { id } = created.body.classroom;
    expect(created.body.classroom).toMatchObject({
      cname: 'Data Structures',
      ccode: 'CS201',
      days: 0,
      strength: 0,
      checkIn: { active: false },
    });

    await addStudents(teacher, id, [
      { name: 'A', roll: 1 },
      { name: 'B', roll: 2 },
    ]);

    const list = await api().get('/api/classrooms').set(teacher.auth).expect(200);
    expect(list.body.classrooms).toHaveLength(1);
    expect(list.body.classrooms[0]).toMatchObject({ id, strength: 2 });

    const updated = await api()
      .patch(`/api/classrooms/${id}`)
      .set(teacher.auth)
      .send({ cname: 'DSA', days: '12' })
      .expect(200);
    expect(updated.body.classroom).toMatchObject({ cname: 'DSA', ccode: 'CS201', days: 12 });

    await api().delete(`/api/classrooms/${id}`).set(teacher.auth).expect(204);
    await api().get(`/api/classrooms/${id}`).set(teacher.auth).expect(404);
  });

  it('removes the roster and attendance history with the classroom', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    const [student] = await addStudents(teacher, room.id, [{ name: 'A', roll: 1 }]);
    await api()
      .put(`/api/classrooms/${room.id}/attendance/${today()}`)
      .set(teacher.auth)
      .send({ records: [{ studentId: student.id, status: 'Present' }] })
      .expect(201);

    await api().delete(`/api/classrooms/${room.id}`).set(teacher.auth).expect(204);

    expect(await Student.countDocuments({ roomid: room.id })).toBe(0);
    expect(await AttendanceRecord.countDocuments({ roomid: room.id })).toBe(0);
    expect(await Classroom.exists({ _id: room.id })).toBeNull();
  });

  it('rejects a duplicate course code for the same teacher only', async () => {
    const teacher = await registerTeacher();
    const other = await registerTeacher();
    await createClassroom(teacher, { ccode: 'MA101' });

    const res = await api()
      .post('/api/classrooms')
      .set(teacher.auth)
      .send({ cname: 'Again', ccode: 'MA101' })
      .expect(409);
    expect(res.body.code).toBe('DUPLICATE_COURSE_CODE');

    await createClassroom(other, { ccode: 'MA101' });
  });

  it('rejects renaming the course code to one already in use', async () => {
    const teacher = await registerTeacher();
    await createClassroom(teacher, { ccode: 'A1' });
    const second = await createClassroom(teacher, { ccode: 'B2' });
    await api()
      .patch(`/api/classrooms/${second.id}`)
      .set(teacher.auth)
      .send({ ccode: 'A1' })
      .expect(409);
  });

  it('validates input', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);

    await api().post('/api/classrooms').set(teacher.auth).send({ cname: 'No code' }).expect(400);
    await api().patch(`/api/classrooms/${room.id}`).set(teacher.auth).send({}).expect(400);
    await api()
      .patch(`/api/classrooms/${room.id}`)
      .set(teacher.auth)
      .send({ days: -1 })
      .expect(400);
    await api().get('/api/classrooms/not-an-id').set(teacher.auth).expect(400);
  });
});

describe('access control', () => {
  it('requires authentication', async () => {
    await api().get('/api/classrooms').expect(401);
  });

  it('is limited to teacher accounts', async () => {
    const student = await registerStudent(1);
    const res = await api().get('/api/classrooms').set(student.auth).expect(403);
    expect(res.body.message).toMatch(/Teacher/);
  });

  it("hides other teachers' classrooms", async () => {
    const owner = await registerTeacher();
    const intruder = await registerTeacher();
    const room = await createClassroom(owner);

    await api().get(`/api/classrooms/${room.id}`).set(intruder.auth).expect(404);
    await api()
      .patch(`/api/classrooms/${room.id}`)
      .set(intruder.auth)
      .send({ cname: 'Hijacked' })
      .expect(404);
    await api().delete(`/api/classrooms/${room.id}`).set(intruder.auth).expect(404);
    await api().get(`/api/classrooms/${room.id}/students`).set(intruder.auth).expect(404);
    await api()
      .post(`/api/classrooms/${room.id}/students`)
      .set(intruder.auth)
      .send({ name: 'X', roll: 9 })
      .expect(404);

    const list = await api().get('/api/classrooms').set(intruder.auth).expect(200);
    expect(list.body.classrooms).toEqual([]);
  });
});

describe('roster management', () => {
  it('adds students and lists them by roll number', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);

    const added = await api()
      .post(`/api/classrooms/${room.id}/students`)
      .set(teacher.auth)
      .send({ name: 'Zed', roll: '30', attendance: '4' })
      .expect(201);
    expect(added.body.student).toMatchObject({ name: 'Zed', roll: 30, attendance: 4 });

    await api()
      .post(`/api/classrooms/${room.id}/students`)
      .set(teacher.auth)
      .send({ name: 'Amy', roll: 10 })
      .expect(201);

    const list = await api()
      .get(`/api/classrooms/${room.id}/students`)
      .set(teacher.auth)
      .expect(200);
    expect(list.body.students.map((student) => student.roll)).toEqual([10, 30]);
    expect(list.body.students[0].attendance).toBe(0);
  });

  it('returns an empty roster instead of an error', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    const res = await api()
      .get(`/api/classrooms/${room.id}/students`)
      .set(teacher.auth)
      .expect(200);
    expect(res.body.students).toEqual([]);
  });

  it('rejects duplicate roll numbers within a classroom', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    await addStudents(teacher, room.id, [{ name: 'A', roll: 1 }]);

    const res = await api()
      .post(`/api/classrooms/${room.id}/students`)
      .set(teacher.auth)
      .send({ name: 'Again', roll: 1 })
      .expect(409);
    expect(res.body.code).toBe('DUPLICATE_ROLL');
  });

  it('validates bulk imports', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    await addStudents(teacher, room.id, [{ name: 'A', roll: 1 }]);
    const bulk = (students) =>
      api().post(`/api/classrooms/${room.id}/students/bulk`).set(teacher.auth).send({ students });

    const duplicates = await bulk([
      { name: 'B', roll: 2 },
      { name: 'C', roll: 2 },
    ]).expect(400);
    expect(duplicates.body.message).toMatch(/Duplicate roll numbers.*2/);

    const existing = await bulk([
      { name: 'B', roll: 2 },
      { name: 'Dup', roll: 1 },
    ]).expect(409);
    expect(existing.body.message).toMatch(/already exist.*1/);

    await bulk([{ name: 'Bad', roll: 'abc' }]).expect(400);
    await bulk([]).expect(400);

    const ok = await bulk([
      { name: 'B', roll: 2, attendance: 3 },
      { name: 'C', roll: 3 },
    ]).expect(201);
    expect(ok.body.message).toBe('Successfully imported 2 students.');
    expect(await Student.countDocuments({ roomid: room.id })).toBe(3);
  });

  it('removes a deleted student from past attendance records', async () => {
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    const [keep, remove] = await addStudents(teacher, room.id, [
      { name: 'Keep', roll: 1 },
      { name: 'Remove', roll: 2 },
    ]);
    await api()
      .put(`/api/classrooms/${room.id}/attendance/${today()}`)
      .set(teacher.auth)
      .send({
        records: [
          { studentId: keep.id, status: 'Present' },
          { studentId: remove.id, status: 'Present' },
        ],
      })
      .expect(201);

    await api()
      .delete(`/api/classrooms/${room.id}/students/${remove.id}`)
      .set(teacher.auth)
      .expect(204);
    await api()
      .delete(`/api/classrooms/${room.id}/students/${remove.id}`)
      .set(teacher.auth)
      .expect(404);

    const sessions = await api()
      .get(`/api/classrooms/${room.id}/attendance`)
      .set(teacher.auth)
      .expect(200);
    expect(sessions.body.sessions).toEqual([{ date: today(), presentCount: 1, totalCount: 1 }]);
  });
});
