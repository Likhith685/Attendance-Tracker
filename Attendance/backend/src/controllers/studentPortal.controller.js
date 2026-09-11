import mongoose from 'mongoose';
import { AttendanceRecord, Classroom, Student } from '../models/index.js';
import { checkInStudent } from '../services/checkin.service.js';
import { toCheckInDTO } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';

/** Every classroom the signed-in student is enrolled in, with their attendance history. */
export async function getDashboard(req, res) {
  const { roll } = req.user;
  if (roll == null) return res.json({ roll: null, classrooms: [] });

  const rosters = await Student.find({ roll }).lean();
  const roomIds = rosters.map((entry) => entry.roomid).filter(mongoose.isObjectIdOrHexString);
  const rosterIds = rosters.map((entry) => entry._id);

  const [classrooms, records] = await Promise.all([
    Classroom.find({ _id: { $in: roomIds } }).lean(),
    AttendanceRecord.find(
      { roomid: { $in: roomIds }, 'records.studentId': { $in: rosterIds } },
      { roomid: 1, date: 1, records: { $elemMatch: { studentId: { $in: rosterIds } } } },
    ).lean(),
  ]);

  const classroomById = new Map(classrooms.map((room) => [String(room._id), room]));
  const logsByRoom = new Map();
  for (const record of records) {
    const [entry] = record.records ?? [];
    if (!entry) continue;
    const logs = logsByRoom.get(record.roomid) ?? [];
    logs.push({ date: record.date, status: entry.status });
    logsByRoom.set(record.roomid, logs);
  }

  const enrolled = rosters
    .filter((entry) => classroomById.has(entry.roomid))
    .map((entry) => {
      const room = classroomById.get(entry.roomid);
      const days = room.days ?? 0;
      const attendance = entry.attendance ?? 0;
      return {
        id: String(room._id),
        cname: room.cname,
        ccode: room.ccode,
        days,
        attendance,
        percentage: days > 0 ? (attendance / days) * 100 : 0,
        checkIn: toCheckInDTO(room),
        logs: (logsByRoom.get(entry.roomid) ?? []).sort((a, b) => b.date.localeCompare(a.date)),
      };
    });

  res.json({ roll, classrooms: enrolled });
}

/** Public details of a classroom the student is enrolled in (never includes the PIN). */
export async function getClassroom(req, res) {
  const { id } = req.validated.params;
  const [enrolled, classroom] = await Promise.all([
    Student.exists({ roomid: id, roll: req.user.roll }),
    Classroom.findById(id).lean(),
  ]);
  if (!enrolled || !classroom) throw ApiError.notFound('Classroom not found.');

  res.json({
    classroom: {
      id: String(classroom._id),
      cname: classroom.cname,
      ccode: classroom.ccode,
      checkIn: toCheckInDTO(classroom),
    },
  });
}

export async function checkIn(req, res) {
  const { code, latitude, longitude } = req.validated.body;
  const result = await checkInStudent({
    classroomId: req.validated.params.id,
    roll: req.user.roll,
    code,
    latitude,
    longitude,
  });

  res.json({
    ...result,
    message: result.alreadyCheckedIn
      ? 'You have already checked in for this session.'
      : 'Checked in! Your attendance has been marked as present.',
  });
}
