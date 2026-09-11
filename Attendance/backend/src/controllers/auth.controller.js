import { ROLES, User } from '../models/index.js';
import { verifyGoogleCredential } from '../services/google.service.js';
import { hashPassword, verifyPassword } from '../services/password.service.js';
import { toUserDTO } from '../services/serializers.js';
import { signAccessToken } from '../services/token.service.js';
import { ApiError } from '../utils/ApiError.js';

const emailTaken = () =>
  ApiError.conflict('An account with this email already exists.', { code: 'EMAIL_TAKEN' });
const rollTaken = (roll) =>
  ApiError.conflict(`Roll number ${roll} is already registered by another student.`, {
    code: 'ROLL_TAKEN',
  });

function authResponse(user) {
  return { token: signAccessToken(user), user: toUserDTO(user) };
}

async function assertAccountAvailable({ email, role, roll }) {
  if (await User.findByEmail(email)) throw emailTaken();
  if (role === ROLES.STUDENT && (await User.exists({ role: ROLES.STUDENT, roll }))) {
    throw rollTaken(roll);
  }
}

async function createUser(fields) {
  try {
    return await User.create(fields);
  } catch (err) {
    // A concurrent registration can still win the race against the checks above.
    if (err?.code === 11000) throw err.keyPattern?.roll ? rollTaken(fields.roll) : emailTaken();
    throw err;
  }
}

export async function register(req, res) {
  const { name, email, password, role, roll } = req.validated.body;
  await assertAccountAvailable({ email, role, roll });
  const user = await createUser({
    name,
    email,
    password: await hashPassword(password),
    role,
    roll,
  });
  res.status(201).json(authResponse(user));
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findByEmail(email, { withPassword: true });
  const { valid, needsRehash } = await verifyPassword(password, user?.password);

  if (!user || !valid) {
    throw ApiError.unauthorized('Invalid email or password.', { code: 'INVALID_CREDENTIALS' });
  }

  if (needsRehash) {
    await User.updateOne({ _id: user._id }, { $set: { password: await hashPassword(password) } });
  }

  res.json(authResponse(user));
}

export async function googleLogin(req, res) {
  const { email } = await verifyGoogleCredential(req.validated.body.credential);
  const user = await User.findByEmail(email);
  if (!user) {
    throw ApiError.notFound('No account is registered with this Google email yet.', {
      code: 'ACCOUNT_NOT_FOUND',
    });
  }
  res.json(authResponse(user));
}

export async function googleRegister(req, res) {
  const { credential, role, roll } = req.validated.body;
  const { email, name } = await verifyGoogleCredential(credential);
  await assertAccountAvailable({ email, role, roll });
  const user = await createUser({ name, email, role, roll });
  res.status(201).json(authResponse(user));
}

export function getCurrentUser(req, res) {
  res.json({ user: req.user });
}
