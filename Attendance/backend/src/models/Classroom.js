import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    cname: { type: String, required: true, trim: true, maxlength: 100 },
    ccode: { type: String, required: true, trim: true, maxlength: 30 },
    // Owning teacher's user id (stored as a string for compatibility with existing data).
    userid: { type: String, required: true },
    // Total sessions held; teachers may also adjust this manually.
    days: { type: Number, default: 0, min: 0 },

    checkInActive: { type: Boolean, default: false },
    checkInCode: { type: String, select: false },
    checkInLatitude: { type: Number },
    checkInLongitude: { type: Number },
    checkInExpiresAt: { type: Date },
    // Attendance date (YYYY-MM-DD) that self check-ins are recorded against.
    checkInDate: { type: String },
  },
  { timestamps: true },
);

classroomSchema.index({ userid: 1, ccode: 1 }, { unique: true });

classroomSchema.methods.isCheckInOpen = function isCheckInOpen(now = new Date()) {
  return Boolean(this.checkInActive && this.checkInExpiresAt && this.checkInExpiresAt > now);
};

classroomSchema.methods.requiresLocation = function requiresLocation() {
  return this.checkInLatitude != null && this.checkInLongitude != null;
};

export const Classroom = mongoose.model('Classroom', classroomSchema);
