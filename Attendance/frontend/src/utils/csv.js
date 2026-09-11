export const MAX_IMPORT_ROWS = 1000;

export const CSV_TEMPLATE =
  'Name,Roll,Attendance\nJohn Doe,101,15\nJane Smith,102,12\nBob Johnson,103,0\n';

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const WHOLE_NUMBER = /^\d+$/;

export const isCsvFile = (file) => Boolean(file) && /\.csv$/i.test(file.name);

/** Splits one CSV line, honouring double-quoted fields ("Doe, Jane") and escaped quotes (""). */
export function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

/**
 * Parses a roster CSV with the columns Name, Roll and an optional Attendance.
 * A header row is detected automatically.
 * @returns {{ students: { name: string, roll: number, attendance: number }[], errors: string[] }}
 */
export function parseStudentCsv(text) {
  const lines = (text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text).split(/\r?\n/);
  const students = [];
  const errors = [];
  const seenRolls = new Set();

  const firstLine = (lines[0] ?? '').toLowerCase();
  const startIndex = firstLine.includes('name') || firstLine.includes('roll') ? 1 : 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    const row = index + 1;
    const [name = '', rollText = '', attendanceText = ''] = splitCsvLine(line);

    if (!name) {
      errors.push(`Row ${row}: Name is empty.`);
    } else if (name.length > 100) {
      errors.push(`Row ${row}: Name must be at most 100 characters.`);
    } else if (!rollText) {
      errors.push(`Row ${row}: Roll number is missing.`);
    } else if (!WHOLE_NUMBER.test(rollText) || Number(rollText) === 0) {
      errors.push(`Row ${row}: Roll number "${rollText}" must be a positive whole number.`);
    } else if (seenRolls.has(Number(rollText))) {
      errors.push(`Row ${row}: Duplicate roll number ${Number(rollText)} in file.`);
    } else if (attendanceText && !WHOLE_NUMBER.test(attendanceText)) {
      errors.push(`Row ${row}: Attendance "${attendanceText}" must be a whole number.`);
    } else {
      const roll = Number(rollText);
      seenRolls.add(roll);
      students.push({ name, roll, attendance: attendanceText ? Number(attendanceText) : 0 });
    }
  }

  if (students.length > MAX_IMPORT_ROWS) {
    errors.push(
      `The file lists ${students.length} students; import at most ${MAX_IMPORT_ROWS} at a time.`,
    );
  }
  if (students.length === 0 && errors.length === 0) {
    errors.push('The file does not contain any students.');
  }

  return { students, errors };
}
