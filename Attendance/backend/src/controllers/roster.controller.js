import { Student } from '../models/index.js';
import { removeStudentFromRecords } from '../services/attendance.service.js';
import { toStudentDTO } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';

export async function listStudents(req, res) {
  const students = await Student.find({ roomid: String(req.classroom._id) })
    .sort({ roll: 1 })
    .lean();
  res.json({ students: students.map(toStudentDTO) });
}

export async function addStudent(req, res) {
  const { name, roll, attendance } = req.validated.body;
  const roomId = String(req.classroom._id);

  if (await Student.exists({ roomid: roomId, roll })) {
    throw ApiError.conflict(
      `A student with roll number ${roll} already exists in this classroom.`,
      {
        code: 'DUPLICATE_ROLL',
      },
    );
  }

  const student = await Student.create({ name, roll, attendance, roomid: roomId });
  res.status(201).json({ student: toStudentDTO(student) });
}

export async function bulkAddStudents(req, res) {
  const { students } = req.validated.body;
  const roomId = String(req.classroom._id);

  const existing = await Student.find({
    roomid: roomId,
    roll: { $in: students.map((student) => student.roll) },
  })
    .select('roll')
    .lean();

  if (existing.length > 0) {
    const rolls = existing.map((student) => student.roll).sort((a, b) => a - b);
    throw ApiError.conflict(
      `These roll numbers already exist in this classroom: ${rolls.join(', ')}`,
      { code: 'DUPLICATE_ROLL' },
    );
  }

  const inserted = await Student.insertMany(
    students.map((student) => ({ ...student, roomid: roomId })),
  );
  const count = inserted.length;

  res.status(201).json({
    students: inserted.map(toStudentDTO),
    message: `Successfully imported ${count} student${count === 1 ? '' : 's'}.`,
  });
}

export async function removeStudent(req, res) {
  const roomId = String(req.classroom._id);
  const student = await Student.findOneAndDelete({
    _id: req.validated.params.studentId,
    roomid: roomId,
  });
  if (!student) throw ApiError.notFound('Student not found in this classroom.');

  await removeStudentFromRecords(roomId, student._id);
  res.status(204).end();
}
