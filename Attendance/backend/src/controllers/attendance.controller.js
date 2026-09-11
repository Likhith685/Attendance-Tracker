import * as attendanceService from '../services/attendance.service.js';
import * as checkInService from '../services/checkin.service.js';
import { toCheckInDTO } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { isFutureDate } from '../utils/date.js';

function assertNotFuture(date) {
  if (isFutureDate(date)) {
    throw ApiError.badRequest('Attendance cannot be recorded for a future date.');
  }
}

export async function listSessions(req, res) {
  const sessions = await attendanceService.listSessions(String(req.classroom._id));
  res.json({ sessions });
}

export async function getSession(req, res) {
  const session = await attendanceService.getSession(
    String(req.classroom._id),
    req.validated.params.date,
  );
  if (!session) {
    throw ApiError.notFound('Attendance has not been marked for this date yet.', {
      code: 'SESSION_NOT_FOUND',
    });
  }
  res.json({ session });
}

export async function saveSession(req, res) {
  const { date } = req.validated.params;
  assertNotFuture(date);

  const session = await attendanceService.saveSession({
    classroom: req.classroom,
    date,
    records: req.validated.body.records,
  });
  res.status(session.created ? 201 : 200).json({ session });
}

export async function startCheckIn(req, res) {
  const options = req.validated.body;
  if (options.date) assertNotFuture(options.date);

  await checkInService.startCheckIn(req.classroom, options);
  res.status(201).json({ checkIn: toCheckInDTO(req.classroom, { includeCode: true }) });
}

export async function stopCheckIn(req, res) {
  await checkInService.stopCheckIn(req.classroom);
  res.status(204).end();
}
