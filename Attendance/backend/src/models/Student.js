import mongoose from 'mongoose';

/** A roster entry: one student enrolled in one classroom. */
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    roll: { type: Number, required: true },
    // Classroom id (stored as a string for compatibility with existing data).
    roomid: { type: String, required: true },
    // Sessions attended; seeded by the teacher and kept in sync with attendance records.
    attendance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

studentSchema.index({ roomid: 1, roll: 1 }, { unique: true });
studentSchema.index({ roll: 1 });

export const Student = mongoose.model('Student', studentSchema);
