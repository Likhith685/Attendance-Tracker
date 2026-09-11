import { z } from 'zod';
import { isIsoDate } from '../utils/date.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/** Form fields often arrive as strings; treat blank values as "not provided". */
function toNumberInput(value) {
  if (value === '' || value === null) return undefined;
  if (typeof value === 'string') return Number(value.trim());
  return value;
}

export const objectId = (label = 'id') =>
  z.string({ error: `${label} is required` }).regex(OBJECT_ID_PATTERN, `Invalid ${label}`);

export const requiredText = (label, max) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const rollNumber = z.preprocess(
  toNumberInput,
  z
    .number({
      error: (issue) =>
        issue.input === undefined ? 'Roll number is required' : 'Roll number must be a number',
    })
    .int('Roll number must be a whole number')
    .positive('Roll number must be a positive number')
    .max(Number.MAX_SAFE_INTEGER, 'Roll number is too large'),
);

export const wholeNumber = (label, max = 100_000) =>
  z.preprocess(
    toNumberInput,
    z
      .number({ error: `${label} must be a number` })
      .int(`${label} must be a whole number`)
      .min(0, `${label} cannot be negative`)
      .max(max, `${label} must be at most ${max}`),
  );

export const isoDate = z
  .string({ error: 'Date is required' })
  .refine(isIsoDate, 'Date must be a valid date in YYYY-MM-DD format');

export const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Please enter a valid email address'));

export const role = z.enum(['Teacher', 'Student'], { error: 'Role must be Teacher or Student' });

/** Adds a validation issue for every value that appears more than once. */
export function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}
