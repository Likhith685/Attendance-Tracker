import { describe, expect, it } from 'vitest';
import {
  attendancePercentage,
  clampPercentage,
  DEFAULTER_THRESHOLD,
  getAttendanceTone,
} from './attendance';
import { CSV_TEMPLATE, isCsvFile, parseStudentCsv, splitCsvLine } from './csv';
import { formatCountdown, isIsoDateString, toLocalDateString } from './date';
import { clearSession, loadSession, saveSession } from './storage';

describe('date utilities', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toLocalDateString(new Date(2025, 0, 5))).toBe('2025-01-05');
    expect(toLocalDateString(new Date(2024, 11, 31, 23, 59))).toBe('2024-12-31');
  });

  it('validates ISO date strings', () => {
    expect(isIsoDateString('2024-02-29')).toBe(true);
    expect(isIsoDateString('2023-02-29')).toBe(false);
    expect(isIsoDateString('2024-1-1')).toBe(false);
    expect(isIsoDateString(null)).toBe(false);
  });

  it('formats countdowns', () => {
    expect(formatCountdown(125)).toBe('2:05');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-4)).toBe('0:00');
  });
});

describe('attendance utilities', () => {
  it('computes percentages safely', () => {
    expect(attendancePercentage(3, 4)).toBe(75);
    expect(attendancePercentage(5, 0)).toBe(0);
  });

  it('classifies attendance levels', () => {
    expect(getAttendanceTone(DEFAULTER_THRESHOLD - 0.1).tone).toBe('danger');
    expect(getAttendanceTone(DEFAULTER_THRESHOLD).tone).toBe('warning');
    expect(getAttendanceTone(90).tone).toBe('good');
  });

  it('clamps progress values', () => {
    expect(clampPercentage(140)).toBe(100);
    expect(clampPercentage(-3)).toBe(0);
    expect(clampPercentage(Number.NaN)).toBe(0);
  });
});

describe('CSV parsing', () => {
  it('parses the downloadable template', () => {
    expect(parseStudentCsv(CSV_TEMPLATE)).toEqual({
      students: [
        { name: 'John Doe', roll: 101, attendance: 15 },
        { name: 'Jane Smith', roll: 102, attendance: 12 },
        { name: 'Bob Johnson', roll: 103, attendance: 0 },
      ],
      errors: [],
    });
  });

  it('supports quoted fields, Windows line endings and a byte order mark', () => {
    const bom = String.fromCharCode(0xfeff);
    const text = `${bom}Name,Roll\r\n"Smith, Jane",7\r\n"O""Brien",8\r\n`;
    expect(parseStudentCsv(text).students).toEqual([
      { name: 'Smith, Jane', roll: 7, attendance: 0 },
      { name: 'O"Brien', roll: 8, attendance: 0 },
    ]);
    expect(splitCsvLine(' a , "b,c" ,d')).toEqual(['a', 'b,c', 'd']);
  });

  it('treats the first row as data when there is no header', () => {
    expect(parseStudentCsv('Alice,1\nBob,2').students.map((s) => s.roll)).toEqual([1, 2]);
  });

  it('reports row-level problems', () => {
    const { students, errors } = parseStudentCsv(
      'Name,Roll,Attendance\n,1\nBob,abc\nCara,3,x\nDan,4\nEve,4\nFay',
    );
    expect(students).toEqual([{ name: 'Dan', roll: 4, attendance: 0 }]);
    expect(errors).toEqual([
      'Row 2: Name is empty.',
      'Row 3: Roll number "abc" must be a positive whole number.',
      'Row 4: Attendance "x" must be a whole number.',
      'Row 6: Duplicate roll number 4 in file.',
      'Row 7: Roll number is missing.',
    ]);
  });

  it('rejects files without students', () => {
    expect(parseStudentCsv('Name,Roll\n\n').errors).toEqual([
      'The file does not contain any students.',
    ]);
  });

  it('recognises CSV files by extension', () => {
    expect(isCsvFile({ name: 'roster.CSV' })).toBe(true);
    expect(isCsvFile({ name: 'roster.xlsx' })).toBe(false);
    expect(isCsvFile(undefined)).toBe(false);
  });
});

describe('session storage', () => {
  it('round-trips a session and removes keys from older versions', () => {
    localStorage.setItem('role', 'Teacher');
    localStorage.setItem('roll', '12');
    saveSession({ token: 'abc', user: { id: '1', name: 'Ada' } });

    expect(loadSession()).toEqual({ token: 'abc', user: { id: '1', name: 'Ada' } });
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('roll')).toBeNull();

    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('ignores incomplete or corrupted data', () => {
    localStorage.setItem('token', 'legacy-token');
    expect(loadSession()).toBeNull();
    localStorage.setItem('user', '{not json');
    expect(loadSession()).toBeNull();
  });
});
