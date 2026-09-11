import { describe, expect, it } from 'vitest';
import {
  addStudents,
  api,
  createClassroom,
  registerStudent,
  registerTeacher,
  useTestDatabase,
} from './helpers.js';

useTestDatabase();

async function markSession(teacher, roomId, date, statusByRoll) {
  const roster = await api().get(`/api/classrooms/${roomId}/students`).set(teacher.auth);
  await api()
    .put(`/api/classrooms/${roomId}/attendance/${date}`)
    .set(teacher.auth)
    .send({
      records: roster.body.students.map((student) => ({
        studentId: student.id,
        status: statusByRoll[student.roll] ?? 'Absent',
      })),
    })
    .expect((res) => expect([200, 201]).toContain(res.status));
}

describe('GET /api/student/dashboard', () => {
  it("summarises every classroom the student's roll number is enrolled in", async () => {
    const student = await registerStudent(21);
    const teacherA = await registerTeacher();
    const teacherB = await registerTeacher();
    const physics = await createClassroom(teacherA, { cname: 'Physics', ccode: 'PH1' });
    const maths = await createClassroom(teacherB, { cname: 'Maths', ccode: 'MA1' });
    await addStudents(teacherA, physics.id, [
      { name: 'Me', roll: 21 },
      { name: 'Other', roll: 22 },
    ]);
    await addStudents(teacherB, maths.id, [{ name: 'Me', roll: 21, attendance: 2 }]);

    await markSession(teacherA, physics.id, '2025-02-01', { 21: 'Present', 22: 'Present' });
    await markSession(teacherA, physics.id, '2025-02-03', { 22: 'Present' });
    await markSession(teacherB, maths.id, '2025-02-02', { 21: 'Present' });

    const res = await api().get('/api/student/dashboard').set(student.auth).expect(200);
    expect(res.body.roll).toBe(21);

    const byCode = Object.fromEntries(res.body.classrooms.map((room) => [room.ccode, room]));
    expect(byCode.PH1).toMatchObject({
      id: physics.id,
      cname: 'Physics',
      days: 2,
      attendance: 1,
      percentage: 50,
      checkIn: { active: false },
      logs: [
        { date: '2025-02-03', status: 'Absent' },
        { date: '2025-02-01', status: 'Present' },
      ],
    });
    expect(byCode.MA1).toMatchObject({
      days: 1,
      attendance: 3,
      logs: [{ date: '2025-02-02', status: 'Present' }],
    });
  });

  it('shows active check-in sessions without the PIN', async () => {
    const student = await registerStudent(5);
    const teacher = await registerTeacher();
    const room = await createClassroom(teacher);
    await addStudents(teacher, room.id, [{ name: 'Me', roll: 5 }]);
    await api().post(`/api/classrooms/${room.id}/check-in`).set(teacher.auth).send({}).expect(201);

    const res = await api().get('/api/student/dashboard').set(student.auth).expect(200);
    expect(res.body.classrooms[0].checkIn.active).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/"code"/);
  });

  it('returns an empty list when the student is not enrolled anywhere', async () => {
    const student = await registerStudent(77);
    const res = await api().get('/api/student/dashboard').set(student.auth).expect(200);
    expect(res.body.classrooms).toEqual([]);
  });

  it('is only available to student accounts', async () => {
    const teacher = await registerTeacher();
    await api().get('/api/student/dashboard').set(teacher.auth).expect(403);
    await api().get('/api/student/dashboard').expect(401);
  });
});

describe('API basics', () => {
  it('reports health', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
  });

  it('returns JSON for unknown routes and malformed bodies', async () => {
    const missing = await api().get('/api/does-not-exist').expect(404);
    expect(missing.body.message).toMatch(/route not found/i);

    await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ')
      .expect(400);
  });

  it('sends security headers and restricts CORS to configured origins', async () => {
    const allowed = await api().get('/api/health').set('Origin', 'http://localhost:3000');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(allowed.headers['x-content-type-options']).toBe('nosniff');
    expect(allowed.headers['x-powered-by']).toBeUndefined();

    const blocked = await api().get('/api/health').set('Origin', 'https://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
