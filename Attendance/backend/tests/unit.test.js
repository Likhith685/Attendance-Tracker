import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/services/password.service.js';
import { isFutureDate, isIsoDate, utcDateString } from '../src/utils/date.js';
import { distanceInMeters } from '../src/utils/geo.js';
import { escapeHtml } from '../src/utils/html.js';

describe('date utilities', () => {
  it('accepts only real calendar dates in YYYY-MM-DD form', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('2024-13-01')).toBe(false);
    expect(isIsoDate('2024-1-01')).toBe(false);
    expect(isIsoDate(20240101)).toBe(false);
  });

  it('allows up to one day ahead of UTC to account for client time zones', () => {
    const now = new Date('2025-06-15T20:00:00Z');
    expect(utcDateString(0, now)).toBe('2025-06-15');
    expect(isFutureDate('2025-06-16', now)).toBe(false);
    expect(isFutureDate('2025-06-17', now)).toBe(true);
  });
});

describe('distanceInMeters', () => {
  it('returns zero for identical points', () => {
    expect(distanceInMeters(22.52, 75.92, 22.52, 75.92)).toBe(0);
  });

  it('matches known distances', () => {
    // One degree of latitude is roughly 111.2 km.
    expect(distanceInMeters(0, 0, 1, 0)).toBeCloseTo(111_195, -2);
  });
});

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<b onclick="x">Tom & 'Jerry'</b>`)).toBe(
      '&lt;b onclick=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/b&gt;',
    );
  });
});

describe('verifyPassword', () => {
  it('verifies bcrypt hashes', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).not.toBe('correct horse');
    expect(await verifyPassword('correct horse', hash)).toEqual({
      valid: true,
      needsRehash: false,
    });
    expect(await verifyPassword('wrong', hash)).toEqual({ valid: false, needsRehash: false });
  });

  it('accepts legacy plaintext passwords and flags them for rehashing', async () => {
    expect(await verifyPassword('legacy-pass', 'legacy-pass')).toEqual({
      valid: true,
      needsRehash: true,
    });
    expect(await verifyPassword('other', 'legacy-pass')).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it('rejects accounts without a password', async () => {
    expect(await verifyPassword('anything', undefined)).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it('uses the configured bcrypt cost', async () => {
    expect(bcrypt.getRounds(await hashPassword('x'))).toBe(4);
  });
});
