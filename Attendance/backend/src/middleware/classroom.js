import { Classroom } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Loads the classroom from `:id` and ensures the current teacher owns it.
 * Classrooms owned by someone else are reported as missing to avoid leaking their existence.
 */
export async function loadOwnedClassroom(req, _res, next) {
  const classroom = await Classroom.findById(req.validated.params.id).select('+checkInCode');
  if (!classroom || classroom.userid !== req.user.id) {
    throw ApiError.notFound('Classroom not found.');
  }
  req.classroom = classroom;
  next();
}
