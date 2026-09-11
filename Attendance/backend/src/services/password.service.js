import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;
// Compared against when an account has no password, so failed logins take similar time.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-mitigation', 10);

export function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

/**
 * Verifies a password against the stored value. Accounts created before hashing
 * was introduced still hold plaintext; those are compared in constant time and
 * flagged with `needsRehash` so the caller can upgrade them transparently.
 */
export async function verifyPassword(plain, stored) {
  if (!stored) {
    await bcrypt.compare(plain, DUMMY_HASH);
    return { valid: false, needsRehash: false };
  }

  if (BCRYPT_HASH_PATTERN.test(stored)) {
    return { valid: await bcrypt.compare(plain, stored), needsRehash: false };
  }

  const given = Buffer.from(plain);
  const expected = Buffer.from(stored);
  const valid = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  return { valid, needsRehash: valid };
}
