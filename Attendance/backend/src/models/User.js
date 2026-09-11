import mongoose from 'mongoose';

export const ROLES = Object.freeze({ TEACHER: 'Teacher', STUDENT: 'Student' });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash. Absent for accounts created through Google sign-in.
    password: { type: String, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.TEACHER },
    // Institute roll number; links a student account to classroom roster entries.
    roll: { type: Number },
  },
  { timestamps: true },
);

userSchema.index(
  { roll: 1 },
  { unique: true, partialFilterExpression: { role: ROLES.STUDENT, roll: { $exists: true } } },
);

/**
 * Finds a user by email. Older accounts may have been stored with mixed-case
 * emails, so fall back to a case-insensitive match when the exact one misses.
 */
userSchema.statics.findByEmail = async function findByEmail(email, { withPassword = false } = {}) {
  const normalized = String(email).trim().toLowerCase();
  const select = withPassword ? '+password' : '';
  return (
    (await this.findOne({ email: normalized }).select(select)) ??
    (await this.findOne({ email: normalized })
      .collation({ locale: 'en', strength: 2 })
      .select(select))
  );
};

export const User = mongoose.model('User', userSchema);
