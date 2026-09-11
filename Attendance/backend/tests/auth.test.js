import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../src/models/index.js';
import { verifyGoogleCredential } from '../src/services/google.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { api, registerStudent, registerTeacher, registerUser, useTestDatabase } from './helpers.js';

vi.mock('../src/services/google.service.js', () => ({ verifyGoogleCredential: vi.fn() }));

useTestDatabase();

describe('POST /api/auth/register', () => {
  it('creates a teacher account and returns a session', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'Ada@Example.com', password: 'password123' })
      .expect(201);

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: expect.any(String),
      name: 'Ada',
      email: 'ada@example.com',
      role: 'Teacher',
      roll: null,
    });
  });

  it('stores a bcrypt hash instead of the plaintext password', async () => {
    const { user } = await registerTeacher({ password: 'super-secret-1' });
    const stored = await User.findById(user.id).select('+password').lean();
    expect(stored.password).toMatch(/^\$2[aby]\$/);
    expect(stored.password).not.toContain('super-secret-1');
  });

  it('rejects an email that is already registered, ignoring case', async () => {
    await registerTeacher({ email: 'taken@example.com' });
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'TAKEN@example.com', password: 'password123' })
      .expect(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('requires a roll number for students and keeps it unique', async () => {
    const missing = await api()
      .post('/api/auth/register')
      .send({ name: 'S', email: 's@example.com', password: 'password123', role: 'Student' })
      .expect(400);
    expect(missing.body.message).toMatch(/roll number is required/i);

    await registerStudent(101);
    const duplicate = await api()
      .post('/api/auth/register')
      .send({
        name: 'S2',
        email: 's2@example.com',
        password: 'password123',
        role: 'Student',
        roll: '101',
      })
      .expect(409);
    expect(duplicate.body.code).toBe('ROLL_TAKEN');
  });

  it('ignores a roll number sent for a teacher', async () => {
    const { user } = await registerTeacher({ roll: 5 });
    expect(user.roll).toBeNull();
  });

  it.each([
    [{ name: 'X', email: 'not-an-email', password: 'password123' }, /valid email/i],
    [{ name: 'X', email: 'x@example.com', password: 'short' }, /at least 8/i],
    [{ name: '  ', email: 'x@example.com', password: 'password123' }, /name is required/i],
    [{ name: 'X', email: 'x@example.com', password: 'password123', role: 'Admin' }, /role/i],
  ])('validates the payload %#', async (payload, message) => {
    const res = await api().post('/api/auth/register').send(payload).expect(400);
    expect(res.body.message).toMatch(message);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects operator objects instead of passing them to MongoDB', async () => {
    await api()
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'password123' })
      .expect(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a session for valid credentials', async () => {
    const account = await registerStudent(7, { email: 'student@example.com' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'STUDENT@example.com', password: account.password })
      .expect(200);
    expect(res.body.user).toMatchObject({ role: 'Student', roll: 7 });
  });

  it('uses the same error for an unknown email and a wrong password', async () => {
    await registerTeacher({ email: 'known@example.com' });
    const wrongPassword = await api()
      .post('/api/auth/login')
      .send({ email: 'known@example.com', password: 'incorrect-password' })
      .expect(401);
    const unknownEmail = await api()
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'incorrect-password' })
      .expect(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('logs in legacy plaintext accounts and upgrades them to a hash', async () => {
    await User.collection.insertOne({
      name: 'Legacy',
      email: 'Legacy.User@Example.com',
      password: 'old-plaintext',
      role: 'Teacher',
    });

    await api()
      .post('/api/auth/login')
      .send({ email: 'legacy.user@example.com', password: 'old-plaintext' })
      .expect(200);

    const stored = await User.collection.findOne({ name: 'Legacy' });
    expect(stored.password).toMatch(/^\$2[aby]\$/);

    // The upgraded hash keeps working.
    await api()
      .post('/api/auth/login')
      .send({ email: 'legacy.user@example.com', password: 'old-plaintext' })
      .expect(200);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const account = await registerTeacher({ name: 'Grace' });
    const res = await api().get('/api/auth/me').set(account.auth).expect(200);
    expect(res.body.user).toEqual(account.user);
  });

  it('rejects missing, malformed and forged tokens', async () => {
    await api().get('/api/auth/me').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Token abc').expect(401);

    const forged = jwt.sign({ role: 'Teacher' }, 'secretkey', { subject: '0'.repeat(24) });
    await api().get('/api/auth/me').set('Authorization', `Bearer ${forged}`).expect(401);
  });

  it('rejects tokens of deleted accounts', async () => {
    const account = await registerUser();
    await User.deleteOne({ _id: account.user.id });
    await api().get('/api/auth/me').set(account.auth).expect(401);
  });
});

describe('Google sign-in', () => {
  beforeEach(() => {
    vi.mocked(verifyGoogleCredential).mockReset();
    vi.mocked(verifyGoogleCredential).mockResolvedValue({
      email: 'google.user@gmail.com',
      name: 'Google User',
    });
  });

  it('asks unregistered users to choose a role', async () => {
    const res = await api().post('/api/auth/google').send({ credential: 'id-token' }).expect(404);
    expect(res.body.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('registers and then logs in with a verified Google account', async () => {
    const created = await api()
      .post('/api/auth/google/register')
      .send({ credential: 'id-token', role: 'Student', roll: 42 })
      .expect(201);
    expect(created.body.user).toMatchObject({
      name: 'Google User',
      email: 'google.user@gmail.com',
      role: 'Student',
      roll: 42,
    });

    const login = await api().post('/api/auth/google').send({ credential: 'id-token' }).expect(200);
    expect(login.body.user.id).toBe(created.body.user.id);

    // Google-only accounts have no password to guess.
    await api()
      .post('/api/auth/login')
      .send({ email: 'google.user@gmail.com', password: 'anything-at-all' })
      .expect(401);
  });

  it('rejects credentials that fail verification', async () => {
    vi.mocked(verifyGoogleCredential).mockRejectedValue(
      ApiError.unauthorized('Invalid Google credential.'),
    );
    await api().post('/api/auth/google').send({ credential: 'bad' }).expect(401);
  });
});
