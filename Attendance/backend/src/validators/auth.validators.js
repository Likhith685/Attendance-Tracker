import { z } from 'zod';
import { email, requiredText, role, rollNumber } from './common.js';

const password = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const googleCredential = z
  .string({ error: 'Google credential is required' })
  .min(1, 'Google credential is required')
  .max(4096, 'Google credential is invalid');

/** Students must supply a roll number; it is ignored for teachers. */
function withRollRules(schema) {
  return schema
    .superRefine((value, ctx) => {
      if (value.role === 'Student' && value.roll === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['roll'],
          message: 'Roll number is required for students',
        });
      }
    })
    .transform((value) => (value.role === 'Student' ? value : { ...value, roll: undefined }));
}

export const registerSchema = withRollRules(
  z.object({
    name: requiredText('Name', 100),
    email,
    password,
    role: role.default('Teacher'),
    roll: rollNumber.optional(),
  }),
);

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(128),
});

export const googleLoginSchema = z.object({ credential: googleCredential });

export const googleRegisterSchema = withRollRules(
  z.object({
    credential: googleCredential,
    role: role.default('Teacher'),
    roll: rollNumber.optional(),
  }),
);
