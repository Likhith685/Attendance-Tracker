import { User } from '../models/index.js';
import { verifyAccessToken } from '../services/token.service.js';
import { ApiError } from '../utils/ApiError.js';

function readBearerToken(req) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** Verifies the JWT and attaches the current user to `req.user`. */
export async function requireAuth(req, _res, next) {
  const token = readBearerToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) throw ApiError.unauthorized('Your account no longer exists.');

  req.user = {
    id: String(user._id),
    name: user.name ?? '',
    email: user.email,
    role: user.role ?? 'Teacher',
    roll: user.roll ?? null,
  };
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw ApiError.forbidden(`This action is only available to ${roles.join(' or ')} accounts.`);
    }
    next();
  };
}
