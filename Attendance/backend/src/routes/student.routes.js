import { Router } from 'express';
import { checkIn, getClassroom, getDashboard } from '../controllers/studentPortal.controller.js';
import { ROLES } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { checkInLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { checkInSchema } from '../validators/checkin.validators.js';
import { classroomParams } from '../validators/classroom.validators.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.STUDENT));

router.get('/dashboard', getDashboard);
router.get('/classrooms/:id', validate({ params: classroomParams }), getClassroom);
router.post(
  '/classrooms/:id/check-in',
  checkInLimiter,
  validate({ params: classroomParams, body: checkInSchema }),
  checkIn,
);

export default router;
