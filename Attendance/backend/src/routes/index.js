import { Router } from 'express';
import { isDatabaseConnected } from '../config/db.js';
import authRoutes from './auth.routes.js';
import classroomRoutes from './classroom.routes.js';
import studentRoutes from './student.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  const databaseUp = isDatabaseConnected();
  res.status(databaseUp ? 200 : 503).json({
    status: databaseUp ? 'ok' : 'degraded',
    database: databaseUp ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
  });
});

router.use('/auth', authRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/student', studentRoutes);

export default router;
