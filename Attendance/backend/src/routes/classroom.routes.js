import { Router } from 'express';
import {
  getSession,
  listSessions,
  saveSession,
  startCheckIn,
  stopCheckIn,
} from '../controllers/attendance.controller.js';
import {
  createClassroom,
  deleteClassroom,
  getClassroom,
  listClassrooms,
  updateClassroom,
} from '../controllers/classroom.controller.js';
import {
  addStudent,
  bulkAddStudents,
  listStudents,
  removeStudent,
} from '../controllers/roster.controller.js';
import { ROLES } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { loadOwnedClassroom } from '../middleware/classroom.js';
import { validate } from '../middleware/validate.js';
import { startCheckInSchema } from '../validators/checkin.validators.js';
import {
  addStudentSchema,
  bulkStudentsSchema,
  classroomParams,
  createClassroomSchema,
  saveSessionSchema,
  sessionParams,
  studentParams,
  updateClassroomSchema,
} from '../validators/classroom.validators.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.TEACHER));

/** Validates the request, then loads the classroom and checks ownership. */
const owned = (schemas = {}) => [
  validate({ params: classroomParams, ...schemas }),
  loadOwnedClassroom,
];

router.get('/', listClassrooms);
router.post('/', validate({ body: createClassroomSchema }), createClassroom);
router.get('/:id', owned(), getClassroom);
router.patch('/:id', owned({ body: updateClassroomSchema }), updateClassroom);
router.delete('/:id', owned(), deleteClassroom);

router.get('/:id/students', owned(), listStudents);
router.post('/:id/students', owned({ body: addStudentSchema }), addStudent);
router.post('/:id/students/bulk', owned({ body: bulkStudentsSchema }), bulkAddStudents);
router.delete('/:id/students/:studentId', owned({ params: studentParams }), removeStudent);

router.get('/:id/attendance', owned(), listSessions);
router.get('/:id/attendance/:date', owned({ params: sessionParams }), getSession);
router.put(
  '/:id/attendance/:date',
  owned({ params: sessionParams, body: saveSessionSchema }),
  saveSession,
);

router.post('/:id/check-in', owned({ body: startCheckInSchema }), startCheckIn);
router.delete('/:id/check-in', owned(), stopCheckIn);

export default router;
