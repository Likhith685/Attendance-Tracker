import { Classroom } from '../models/index.js';
import {
  countStudents,
  countStudentsByClassroom,
  deleteClassroomCascade,
} from '../services/classroom.service.js';
import { toClassroomDTO } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';

const duplicateCode = (ccode) =>
  ApiError.conflict(`You already have a classroom with course code "${ccode}".`, {
    code: 'DUPLICATE_COURSE_CODE',
  });

export async function listClassrooms(req, res) {
  const classrooms = await Classroom.find({ userid: req.user.id }).sort({ _id: 1 }).lean();
  const strengths = await countStudentsByClassroom(classrooms.map((room) => String(room._id)));

  res.json({
    classrooms: classrooms.map((room) =>
      toClassroomDTO(room, { strength: strengths.get(String(room._id)) ?? 0 }),
    ),
  });
}

export async function createClassroom(req, res) {
  const { cname, ccode } = req.validated.body;
  if (await Classroom.exists({ userid: req.user.id, ccode })) throw duplicateCode(ccode);

  let classroom;
  try {
    classroom = await Classroom.create({ cname, ccode, userid: req.user.id, days: 0 });
  } catch (err) {
    if (err?.code === 11000) throw duplicateCode(ccode);
    throw err;
  }

  res.status(201).json({ classroom: toClassroomDTO(classroom) });
}

export async function getClassroom(req, res) {
  const strength = await countStudents(String(req.classroom._id));
  res.json({ classroom: toClassroomDTO(req.classroom, { strength, includeCheckInCode: true }) });
}

export async function updateClassroom(req, res) {
  const { cname, ccode, days } = req.validated.body;
  const { classroom } = req;

  if (
    ccode !== undefined &&
    ccode !== classroom.ccode &&
    (await Classroom.exists({ userid: req.user.id, ccode, _id: { $ne: classroom._id } }))
  ) {
    throw duplicateCode(ccode);
  }

  if (cname !== undefined) classroom.cname = cname;
  if (ccode !== undefined) classroom.ccode = ccode;
  if (days !== undefined) classroom.days = days;
  await classroom.save();

  const strength = await countStudents(String(classroom._id));
  res.json({ classroom: toClassroomDTO(classroom, { strength, includeCheckInCode: true }) });
}

export async function deleteClassroom(req, res) {
  await deleteClassroomCascade(req.classroom);
  res.status(204).end();
}
