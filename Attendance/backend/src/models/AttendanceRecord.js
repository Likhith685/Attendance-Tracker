import mongoose from 'mongoose';

export const ATTENDANCE_STATUS = Object.freeze({ PRESENT: 'Present', ABSENT: 'Absent' });

const entrySchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: Object.values(ATTENDANCE_STATUS), required: true },
  },
  { _id: false },
);

/** Attendance for one classroom on one date. `__v` doubles as a concurrency token. */
const attendanceRecordSchema = new mongoose.Schema(
  {
    roomid: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    records: { type: [entrySchema], default: [] },
  },
  { timestamps: true },
);

attendanceRecordSchema.index({ roomid: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
