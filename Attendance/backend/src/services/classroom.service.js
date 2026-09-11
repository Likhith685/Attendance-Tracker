import { AttendanceRecord, Student } from '../models/index.js';

/** @returns {Promise<Map<string, number>>} roster size keyed by classroom id */
export async function countStudentsByClassroom(roomIds) {
  if (roomIds.length === 0) return new Map();
  const rows = await Student.aggregate([
    { $match: { roomid: { $in: roomIds } } },
    { $group: { _id: '$roomid', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
}

export function countStudents(roomId) {
  return Student.countDocuments({ roomid: roomId });
}

/** Deletes a classroom together with its roster and attendance history. */
export async function deleteClassroomCascade(classroom) {
  const roomId = String(classroom._id);
  await Promise.all([
    Student.deleteMany({ roomid: roomId }),
    AttendanceRecord.deleteMany({ roomid: roomId }),
  ]);
  await classroom.deleteOne();
}
