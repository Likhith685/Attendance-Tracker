import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const baseOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
};

/** Broad protection for the whole API; generous because classrooms often share one campus IP. */
export const apiLimiter = rateLimit({ ...baseOptions, windowMs: 60 * 1000, limit: 600 });

/**
 * Brute-force protection for credential endpoints; only failed attempts count.
 * A 404 from Google sign-in just means "not registered yet", so it is not a failure.
 */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode < 400 || res.statusCode === 404,
  message: { message: 'Too many failed attempts. Please wait 15 minutes and try again.' },
});

/** Limits PIN guesses per student account. */
export const checkInLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
  message: { message: 'Too many check-in attempts. Please wait a few minutes and try again.' },
});
