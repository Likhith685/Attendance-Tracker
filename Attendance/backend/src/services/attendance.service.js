import {
  ATTENDANCE_STATUS,
  AttendanceRecord,
  Classroom,
  ROLES,
  Student,
  User,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { sendAbsenceEmails } from './email.service.js';

const { PRESENT, ABSENT } = ATTENDANCE_STATUS;
const MAX_SAVE_ATTEMPTS = 3;

/** One summary row per marked date, newest first. */
export function listSessions(roomId) {
  return AttendanceRecord.aggregate([
    { $match: { roomid: roomId } },
    {
      $project: {
        _id: 0,
        date: 1,
        totalCount: { $size: '$records' },
        presentCount: {
          $size: { $filter: { input: '$records', cond: { $eq: ['$$this.status', PRESENT] } } },
        },
      },
    },
    { $sort: { date: -1 } },
  ]);
}

export async function getSession(roomId, date) {
  const record = await AttendanceRecord.findOne({ roomid: roomId, date }).lean();
  if (!record) return null;
  return {
    date: record.date,
    records: record.records.map((entry) => ({
      studentId: String(entry.studentId),
      status: entry.status,
    })),
  };
}

async function applyAttendanceDeltas(deltas) {
  const operations = [...deltas].map(([studentId, delta]) =>
    delta > 0
      ? { updateOne: { filter: { _id: studentId }, update: { $inc: { attendance: 1 } } } }
      : {
          updateOne: {
            filter: { _id: studentId, attendance: { $gt: 0 } },
            update: { $inc: { attendance: -1 } },
          },
        },
  );
  if (operations.length > 0) await Student.bulkWrite(operations, { ordered: false });
}

async function notifyAbsentees(students, { courseName, date }) {
  if (students.length === 0) return;

  const accounts = await User.find({
    role: ROLES.STUDENT,
    roll: { $in: students.map((student) => student.roll) },
  })
    .select('email roll')
    .lean();
  const emailByRoll = new Map(accounts.map((account) => [account.roll, account.email]));

  const recipients = students
    .filter((student) => emailByRoll.has(student.roll))
    .map((student) => ({
      to: emailByRoll.get(student.roll),
      studentName: student.name,
      roll: student.roll,
    }));

  const unregistered = students.length - recipients.length;
  if (unregistered > 0) {
    logger.info({ unregistered }, 'Skipped absence emails for students without an account');
  }

  // Awaited on purpose: some hosts suspend work that continues after the response is sent.
  await sendAbsenceEmails(recipients, { courseName, date });
}

/**
 * Creates or replaces the attendance for one classroom and date while keeping
 * each student's attendance counter and the classroom's session count in sync.
 *
 * Student check-ins modify the same record concurrently, so updates are guarded
 * by the record's version (`__v`) and retried when another write wins the race.
 * Students missing from `records` keep their current status (Absent for a new
 * session); only students explicitly marked absent are emailed.
 */
export async function saveSession({ classroom, date, records }) {
  const roomId = String(classroom._id);
  const roster = await Student.find({ roomid: roomId }).sort({ roll: 1 }).lean();
  const explicit = new Map(records.map((record) => [record.studentId, record.status]));

  for (let attempt = 1; attempt <= MAX_SAVE_ATTEMPTS; attempt += 1) {
    const existing = await AttendanceRecord.findOne({ roomid: roomId, date }).lean();
    const previous = new Map(
      (existing?.records ?? []).map((entry) => [String(entry.studentId), entry.status]),
    );
    const nextRecords = roster.map((student) => {
      const id = String(student._id);
      return { studentId: student._id, status: explicit.get(id) ?? previous.get(id) ?? ABSENT };
    });

    if (existing) {
      const result = await AttendanceRecord.updateOne(
        { _id: existing._id, __v: existing.__v },
        { $set: { records: nextRecords }, $inc: { __v: 1 } },
      );
      if (result.matchedCount === 0) continue;
    } else {
      try {
        await AttendanceRecord.create({ roomid: roomId, date, records: nextRecords });
      } catch (err) {
        if (err?.code === 11000) continue; // created concurrently by a check-in
        throw err;
      }
      await Classroom.updateOne({ _id: classroom._id }, { $inc: { days: 1 } });
    }

    const deltas = new Map();
    const newlyAbsent = [];
    roster.forEach((student, index) => {
      const id = String(student._id);
      const before = previous.get(id);
      const after = nextRecords[index].status;

      if (before !== PRESENT && after === PRESENT) deltas.set(id, 1);
      if (before === PRESENT && after !== PRESENT) deltas.set(id, -1);
      if (explicit.get(id) === ABSENT && (!existing || before === PRESENT)) {
        newlyAbsent.push(student);
      }
    });

    await applyAttendanceDeltas(deltas);
    await notifyAbsentees(newlyAbsent, { courseName: classroom.cname, date });

    return {
      date,
      created: !existing,
      presentCount: nextRecords.filter((record) => record.status === PRESENT).length,
      totalCount: nextRecords.length,
    };
  }

  throw ApiError.conflict(
    'Attendance for this date was updated at the same time by someone else. Please try again.',
  );
}

/**
 * Marks one student present for a date, creating the day's record if needed.
 * Every step is a single atomic update, so simultaneous check-ins are safe.
 * @returns {Promise<boolean>} false when the student was already marked present.
 */
export async function markStudentPresent({ classroom, student, date }) {
  const roomId = String(classroom._id);
  const roster = await Student.find({ roomid: roomId }).select('_id').lean();

  const upsert = await AttendanceRecord.updateOne(
    { roomid: roomId, date },
    {
      $setOnInsert: {
        records: roster.map((entry) => ({ studentId: entry._id, status: ABSENT })),
      },
    },
    { upsert: true },
  );
  if (upsert.upsertedCount > 0) {
    await Classroom.updateOne({ _id: classroom._id }, { $inc: { days: 1 } });
  }

  const flipped = await AttendanceRecord.updateOne(
    { roomid: roomId, date, records: { $elemMatch: { studentId: student._id, status: ABSENT } } },
    { $set: { 'records.$.status': PRESENT }, $inc: { __v: 1 } },
  );
  let changed = flipped.modifiedCount > 0;

  if (!changed) {
    const added = await AttendanceRecord.updateOne(
      { roomid: roomId, date, 'records.studentId': { $ne: student._id } },
      { $push: { records: { studentId: student._id, status: PRESENT } }, $inc: { __v: 1 } },
    );
    changed = added.modifiedCount > 0;
  }

  if (changed) await Student.updateOne({ _id: student._id }, { $inc: { attendance: 1 } });
  return changed;
}

/** Removes a deleted student from every attendance record of their classroom. */
export function removeStudentFromRecords(roomId, studentId) {
  return AttendanceRecord.updateMany(
    { roomid: roomId, 'records.studentId': studentId },
    { $pull: { records: { studentId } }, $inc: { __v: 1 } },
  );
}
