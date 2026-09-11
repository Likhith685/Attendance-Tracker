import { z } from 'zod';
import {
  findDuplicates,
  isoDate,
  objectId,
  requiredText,
  rollNumber,
  wholeNumber,
} from './common.js';

export const MAX_BULK_STUDENTS = 1000;

export const classroomParams = z.object({ id: objectId('classroom id') });

export const studentParams = z.object({
  id: objectId('classroom id'),
  studentId: objectId('student id'),
});

export const sessionParams = z.object({ id: objectId('classroom id'), date: isoDate });

export const createClassroomSchema = z.object({
  cname: requiredText('Classroom name', 100),
  ccode: requiredText('Course code', 30),
});

export const updateClassroomSchema = z
  .object({
    cname: requiredText('Classroom name', 100).optional(),
    ccode: requiredText('Course code', 30).optional(),
    days: wholeNumber('Total days').optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Provide at least one field to update',
  });

const studentInput = z.object({
  name: requiredText('Student name', 100),
  roll: rollNumber,
  attendance: wholeNumber('Attendance').default(0),
});

export const addStudentSchema = studentInput;

export const bulkStudentsSchema = z
  .object({
    students: z
      .array(studentInput, { error: 'students must be a list' })
      .min(1, 'Provide at least one student')
      .max(MAX_BULK_STUDENTS, `You can import at most ${MAX_BULK_STUDENTS} students at a time`),
  })
  .superRefine((value, ctx) => {
    const duplicates = findDuplicates(value.students.map((student) => student.roll));
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['students'],
        message: `Duplicate roll numbers in the uploaded list: ${duplicates.join(', ')}`,
      });
    }
  });

export const saveSessionSchema = z
  .object({
    records: z
      .array(
        z.object({
          studentId: objectId('student id'),
          status: z.enum(['Present', 'Absent'], { error: 'Status must be Present or Absent' }),
        }),
      )
      .max(5000),
  })
  .superRefine((value, ctx) => {
    if (findDuplicates(value.records.map((record) => record.studentId)).length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['records'],
        message: 'Each student can only be marked once',
      });
    }
  });
