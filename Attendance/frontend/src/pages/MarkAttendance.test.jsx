import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classroomsApi } from '../api/classrooms';
import { toLocalDateString } from '../utils/date';
import MarkAttendancePage from './MarkAttendance';

vi.mock('../api/classrooms', () => ({
  classroomsApi: {
    get: vi.fn(),
    listStudents: vi.fn(),
    getSession: vi.fn(),
    saveSession: vi.fn(),
  },
}));

const classroom = { id: 'room1', cname: 'Physics', ccode: 'PH101', days: 3, strength: 2 };
const students = [
  { id: 's1', name: 'Alice', roll: 1, attendance: 2 },
  { id: 's2', name: 'Bob', roll: 2, attendance: 1 },
];
const notFound = { response: { status: 404, data: { message: 'Not marked yet' } } };

function renderPage(path = '/classrooms/room1/attendance') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/classrooms/:id/attendance" element={<MarkAttendancePage />} />
        <Route path="/classrooms/:id" element={<p>Classroom page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(classroomsApi.get).mockResolvedValue(classroom);
  vi.mocked(classroomsApi.listStudents).mockResolvedValue(students);
  vi.mocked(classroomsApi.getSession).mockReset();
  vi.mocked(classroomsApi.saveSession).mockReset();
});

describe('MarkAttendance', () => {
  it('marks a new session and returns to the classroom', async () => {
    vi.mocked(classroomsApi.getSession).mockRejectedValue(notFound);
    vi.mocked(classroomsApi.saveSession).mockResolvedValue({ created: true });
    const user = userEvent.setup();
    renderPage();

    const alice = await screen.findByRole('switch', { name: 'Alice is absent' });
    await waitFor(() => expect(alice).toBeEnabled());
    await user.click(alice);
    expect(screen.getByRole('switch', { name: 'Alice is present' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm Attendance' }));

    expect(classroomsApi.saveSession).toHaveBeenCalledWith('room1', toLocalDateString(), [
      { studentId: 's1', status: 'Present' },
      { studentId: 's2', status: 'Absent' },
    ]);
    expect(await screen.findByText('Classroom page')).toBeInTheDocument();
  });

  it('loads an existing session for the date in the URL', async () => {
    vi.mocked(classroomsApi.getSession).mockResolvedValue({
      date: '2025-01-10',
      records: [
        { studentId: 's1', status: 'Absent' },
        { studentId: 's2', status: 'Present' },
      ],
    });
    renderPage('/classrooms/room1/attendance?date=2025-01-10');

    expect(await screen.findByRole('switch', { name: 'Bob is present' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Alice is absent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Attendance' })).toBeInTheDocument();
    expect(screen.getByLabelText('Attendance Session Date:')).toHaveValue('2025-01-10');
    expect(classroomsApi.getSession).toHaveBeenCalledWith('room1', '2025-01-10', expect.anything());
  });

  it('ignores future dates in the URL', async () => {
    vi.mocked(classroomsApi.getSession).mockRejectedValue(notFound);
    renderPage('/classrooms/room1/attendance?date=2999-01-01');

    await screen.findByRole('switch', { name: 'Alice is absent' });
    expect(screen.getByLabelText('Attendance Session Date:')).toHaveValue(toLocalDateString());
  });

  it('explains when the classroom does not exist', async () => {
    vi.mocked(classroomsApi.get).mockRejectedValue(notFound);
    renderPage();
    expect(await screen.findByText('Classroom not found')).toBeInTheDocument();
  });
});
