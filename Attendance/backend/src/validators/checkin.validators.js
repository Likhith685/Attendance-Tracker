import { z } from 'zod';
import { isoDate } from './common.js';

const coordinates = {
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
};

function requireBothCoordinates(value, ctx) {
  if ((value.latitude === undefined) !== (value.longitude === undefined)) {
    ctx.addIssue({
      code: 'custom',
      path: ['longitude'],
      message: 'Latitude and longitude must be provided together',
    });
  }
}

export const startCheckInSchema = z
  .object({
    durationMinutes: z
      .number({ error: 'Duration must be a number of minutes' })
      .int()
      .min(1, 'Duration must be at least 1 minute')
      .max(60, 'Duration can be at most 60 minutes')
      .default(5),
    // The teacher's local date, so check-ins land on the same day as manual marking.
    date: isoDate.optional(),
    ...coordinates,
  })
  .superRefine(requireBothCoordinates);

export const checkInSchema = z
  .object({
    code: z
      .string({ error: 'Check-in PIN is required' })
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit check-in PIN'),
    ...coordinates,
  })
  .superRefine(requireBothCoordinates);
