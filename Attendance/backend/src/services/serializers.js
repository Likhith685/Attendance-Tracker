/** Shapes database documents into the public API contract. */

export function toUserDTO(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name ?? '',
    email: user.email,
    role: user.role ?? 'Teacher',
    roll: user.roll ?? null,
  };
}

export function toStudentDTO(student) {
  return {
    id: String(student._id),
    name: student.name,
    roll: student.roll,
    attendance: student.attendance ?? 0,
  };
}

function isCheckInOpen(room, now) {
  return Boolean(
    room.checkInActive && room.checkInExpiresAt && new Date(room.checkInExpiresAt) > now,
  );
}

/** Check-in session state; the PIN is only included for the owning teacher. */
export function toCheckInDTO(room, { includeCode = false, now = new Date() } = {}) {
  if (!isCheckInOpen(room, now)) {
    return { active: false, expiresAt: null, date: null, locationRequired: false };
  }

  return {
    active: true,
    expiresAt: new Date(room.checkInExpiresAt).toISOString(),
    date: room.checkInDate ?? null,
    locationRequired: room.checkInLatitude != null && room.checkInLongitude != null,
    ...(includeCode && { code: room.checkInCode }),
  };
}

export function toClassroomDTO(room, { strength = 0, includeCheckInCode = false } = {}) {
  return {
    id: String(room._id),
    cname: room.cname,
    ccode: room.ccode,
    days: room.days ?? 0,
    strength,
    checkIn: toCheckInDTO(room, { includeCode: includeCheckInCode }),
  };
}
