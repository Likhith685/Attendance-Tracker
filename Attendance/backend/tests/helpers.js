import crypto from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

export const api = () => request(app);

/** Connects to a fresh database for the current test file and empties it after each test. */
export function useTestDatabase() {
  beforeAll(async () => {
    await mongoose.connect(inject('mongoUri'), { dbName: `test-${crypto.randomUUID()}` });
    // Unique indexes must exist before tests that rely on them run.
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  });

  afterEach(async () => {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
    );
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}

let sequence = 0;
const nextId = () => `${Date.now().toString(36)}${(sequence += 1)}`;

export async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user-${nextId()}@example.com`,
    password: 'password123',
    role: 'Teacher',
    ...overrides,
  };
  const res = await api().post('/api/auth/register').send(payload).expect(201);
  return {
    token: res.body.token,
    user: res.body.user,
    password: payload.password,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}

export const registerTeacher = (overrides) => registerUser({ role: 'Teacher', ...overrides });

export const registerStudent = (roll, overrides) =>
  registerUser({ role: 'Student', roll, name: `Student ${roll}`, ...overrides });

export async function createClassroom(teacher, overrides = {}) {
  const res = await api()
    .post('/api/classrooms')
    .set(teacher.auth)
    .send({ cname: 'Algorithms', ccode: `CS-${nextId()}`, ...overrides })
    .expect(201);
  return res.body.classroom;
}

export async function addStudents(teacher, classroomId, students) {
  const res = await api()
    .post(`/api/classrooms/${classroomId}/students/bulk`)
    .set(teacher.auth)
    .send({ students })
    .expect(201);
  return res.body.students;
}

/** Today's UTC date in YYYY-MM-DD form. */
export const today = () => new Date().toISOString().slice(0, 10);
