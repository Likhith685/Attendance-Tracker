import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Classroom, Student } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { utcDateString } from '../utils/date.js';
import { distanceInMeters } from '../utils/geo.js';
import { markStudentPresent } from './attendance.service.js';

export function generateCheckInCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function codesMatch(expected, given) {
  const a = Buffer.from(String(expected ?? ''));
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function startCheckIn(classroom, { durationMinutes, latitude, longitude, date }) {
  classroom.set({
    checkInActive: true,
    checkInCode: generateCheckInCode(),
    // Undefined coordinates clear any location from a previous session.
    checkInLatitude: latitude,
    checkInLongitude: longitude,
    checkInExpiresAt: new Date(Date.now() + durationMinutes * 60_000),
    checkInDate: date ?? utcDateString(),
  });
  await classroom.save();
  return classroom;
}

export async function stopCheckIn(classroom) {
  await Classroom.updateOne(
    { _id: classroom._id },
    {
      $set: { checkInActive: false },
      $unset: {
        checkInCode: 1,
        checkInLatitude: 1,
        checkInLongitude: 1,
        checkInExpiresAt: 1,
        checkInDate: 1,
      },
    },
  );
}

/** Validates a student's PIN (and location, when required) and marks them present. */
export async function checkInStudent({ classroomId, roll, code, latitude, longitude }) {
  const classroom = await Classroom.findById(classroomId).select('+checkInCode');
  if (!classroom) throw ApiError.notFound('Classroom not found.');

  const student = await Student.findOne({ roomid: classroomId, roll }).lean();
  if (!student) throw ApiError.forbidden('You are not enrolled in this classroom.');

  if (!classroom.checkInActive) {
    throw ApiError.badRequest('There is no active check-in session for this class.');
  }
  if (!classroom.isCheckInOpen()) {
    throw ApiError.badRequest('The check-in session has expired.');
  }
  if (!codesMatch(classroom.checkInCode, code)) {
    throw ApiError.badRequest('Incorrect check-in PIN.');
  }

  if (classroom.requiresLocation()) {
    if (latitude === undefined || longitude === undefined) {
      throw ApiError.badRequest('Location access is required to check in to this class.');
    }
    const distance = distanceInMeters(
      classroom.checkInLatitude,
      classroom.checkInLongitude,
      latitude,
      longitude,
    );
    if (distance > env.CHECKIN_RADIUS_METERS) {
      throw ApiError.badRequest(
        `You are too far from the classroom (about ${Math.round(distance)} m away; ` +
          `the limit is ${env.CHECKIN_RADIUS_METERS} m).`,
      );
    }
  }

  const date = classroom.checkInDate ?? utcDateString();
  const marked = await markStudentPresent({ classroom, student, date });
  return { date, alreadyCheckedIn: !marked };
}
