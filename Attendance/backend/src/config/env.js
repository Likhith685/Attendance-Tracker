import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
    CORS_ORIGINS: z.string().optional(),
    TRUST_PROXY: z.coerce.number().int().min(0).optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_SERVICE: z.string().default('gmail'),
    EMAIL_FROM: z.string().default('"Attendance Tracker" <no-reply@attendance-tracker.com>'),
    EMAIL_ENABLED: booleanString.optional(),
    CHECKIN_RADIUS_METERS: z.coerce.number().positive().default(200),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && !value.CORS_ORIGINS) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list the allowed frontend origin(s) in production',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  // The logger depends on this module, so report configuration errors directly.
  console.error(`Invalid environment configuration:\n${problems}`);
  process.exit(1);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === 'production';
const isTest = raw.NODE_ENV === 'test';

export const env = Object.freeze({
  ...raw,
  isProduction,
  isTest,
  isDevelopment: raw.NODE_ENV === 'development',
  corsOrigins: (raw.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  trustProxy: raw.TRUST_PROXY ?? (isProduction ? 1 : 0),
  // Emails go out when explicitly enabled, or by default outside of tests.
  emailEnabled: raw.EMAIL_ENABLED ?? !isTest,
  logLevel: raw.LOG_LEVEL ?? (isTest ? 'silent' : 'info'),
});
