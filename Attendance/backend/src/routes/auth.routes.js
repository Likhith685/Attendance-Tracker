import { Router } from 'express';
import {
  getCurrentUser,
  googleLogin,
  googleRegister,
  login,
  register,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  googleLoginSchema,
  googleRegisterSchema,
  loginSchema,
  registerSchema,
} from '../validators/auth.validators.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/google', authLimiter, validate({ body: googleLoginSchema }), googleLogin);
router.post(
  '/google/register',
  authLimiter,
  validate({ body: googleRegisterSchema }),
  googleRegister,
);
router.get('/me', requireAuth, getCurrentUser);

export default router;
