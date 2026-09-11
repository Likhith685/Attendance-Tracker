import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { classroomsApi } from '../api/classrooms';
import { getErrorMessage, isCancelledRequest, isNotFoundError } from '../api/client';
import BackButton from '../components/BackButton';
import AddStudentModal from '../components/modals/AddStudentModal';
import CheckInModal from '../components/modals/CheckInModal';
import EditClassroomModal from '../components/modals/EditClassroomModal';
import PageLoader from '../components/PageLoader';
import { PlusIcon } from '../components/icons';
import { useCountdown } from '../hooks/useCountdown';
import {
  attendancePercentage,
  clampPercentage,
  DEFAULTER_THRESHOLD,
  getAttendanceTone,
} from '../utils/attendance';
import { ROUTES } from '../utils/routes';

const tooltipProps = {
  contentStyle: {
    background: '#1f1f1f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  labelStyle: { color: '#fff', fontWeight: 600 },
};

/** Remounts the page when the classroom id changes so no stale data is shown. */
export default function ClassroomDetailsPage() {
  const { id } = useParams();
  return <ClassroomDetails key={id} classroomId={id} />;
}

function ClassroomDetails({ classroomId }) {
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error | notFound
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(null); // addStudent | edit | checkIn
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (signal) =>
      Promise.all([
        classroomsApi.get(classroomId, { signal }),
        classroomsApi.listStudents(classroomId, { signal }),
        classroomsApi.listSessions(classroomId, { signal }),
      ]).then(
        ([room, roster, history]) => {
          setClassroom(room);
          setStudents(roster);
          setSessions(history);
          setStatus('ready');
        },
        (err) => {
          if (isCancelledRequest(err)) return;
          if (isNotFoundError(err)) {
            setStatus('notFound');
          } else {
            setError(getErrorMessage(err, 'Could not load this classroom.'));
            setStatus('error');
          }
        },
      ),
    [classroomId],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const checkIn = classroom?.checkIn;
  const secondsLeft = useCountdown(checkIn?.active ? checkIn.expiresAt : null);
  const checkInActive = Boolean(checkIn?.active) && secondsLeft > 0;
  const days = classroom?.days ?? 0;

  const trendData = useMemo(
    () =>
      [...sessions].reverse().map((session) => ({
        date: session.date.substring(5),
        attendance:
          session.totalCount > 0
            ? Math.round((session.presentCount / session.totalCount) * 100)
            : 0,
      })),
    [sessions],
  );

  const studentStats = useMemo(
    () =>
      students.map((student) => {
        const percentage = attendancePercentage(student.attendance, days);
        return { ...student, percentage, tone: getAttendanceTone(percentage) };
      }),
    [students, days],
  );

  const defaulters =
    days > 0 ? studentStats.filter((student) => student.percentage < DEFAULTER_THRESHOLD) : [];

  const closeModal = () => setOpenModal(null);

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Remove ${student.name} (roll ${student.roll}) from this classroom? Their attendance history for this class will be deleted.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await classroomsApi.removeStudent(classroomId, student.id);
      toast.success(`${student.name} was removed.`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove the student.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteClassroom = async () => {
    const confirmed = window.confirm(
      `Delete "${classroom.cname}"? All students and attendance records in this classroom will be permanently deleted.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await classroomsApi.remove(classroomId);
      toast.success('Classroom deleted.');
      navigate(ROUTES.teacherHome, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the classroom.'));
      setBusy(false);
    }
  };

  if (status === 'loading') return <PageLoader message="Loading classroom..." />;

  if (status !== 'ready') {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div role="alert" style={styles.alertCard}>
            <h1 style={styles.alertText}>
              {status === 'notFound' ? 'Classroom not found' : 'Something went wrong'}
            </h1>
            <p style={styles.alertSubtext}>
              {status === 'notFound'
                ? 'It may have been deleted, or it belongs to another teacher.'
                : error}
            </p>
            <Link
              to={ROUTES.teacherHome}
              style={{
                ...styles.btn,
                ...styles.btnEdit,
                display: 'inline-flex',
                marginTop: '20px',
              }}
            >
              Back to your classrooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hoverProps = (key) => ({
    onMouseEnter: () => setHoveredButton(key),
    onMouseLeave: () => setHoveredButton(null),
  });

  return (
    <div style={styles.pageWrapper}>
      <div className="classroom-container" style={styles.container}>
        <AddStudentModal
          open={openModal === 'addStudent'}
          onClose={closeModal}
          classroomId={classroomId}
          onAdded={() => {
            closeModal();
            load();
          }}
        />
        {openModal === 'edit' && (
          <EditClassroomModal
            classroom={classroom}
            onClose={closeModal}
            onSaved={(updated) => {
              setClassroom(updated);
              closeModal();
            }}
          />
        )}
        <CheckInModal
          open={openModal === 'checkIn'}
          onClose={closeModal}
          classroom={classroom}
          onChange={(nextCheckIn) =>
            setClassroom((current) => ({ ...current, checkIn: nextCheckIn }))
          }
        />

        <BackButton onClick={() => navigate(ROUTES.teacherHome)}>All Classrooms</BackButton>

        <section className="classroom-card" style={styles.roomCard}>
          <div style={styles.roomHeader}>
            <div style={styles.roomBadge} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ opacity: 0.9 }}>
                <path
                  fill="#fff"
                  d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                />
              </svg>
            </div>
            <h1 style={styles.roomCode}>{classroom.ccode}</h1>
          </div>

          <p style={styles.roomName}>{classroom.cname}</p>

          <div style={styles.roomStats}>
            <div style={styles.statCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#10b981"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Strength</span>
                <span style={styles.statValue}>{students.length}</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#3b82f6"
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"
                />
              </svg>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Total Days</span>
                <span style={styles.statValue}>{days}</span>
              </div>
            </div>
          </div>

          <div style={styles.roomActions}>
            <button
              type="button"
              style={{
                ...styles.btn,
                ...styles.btnAdd,
                ...(hoveredButton === 'add' ? styles.btnAddHover : {}),
              }}
              onClick={() => setOpenModal('addStudent')}
              {...hoverProps('add')}
            >
              <PlusIcon />
              <span>Add Students</span>
            </button>

            {students.length > 0 && (
              <Link
                to={ROUTES.markAttendance(classroomId)}
                style={{
                  ...styles.btn,
                  ...styles.btnMark,
                  ...(hoveredButton === 'mark' ? styles.btnMarkHover : {}),
                }}
                {...hoverProps('mark')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="currentColor" d="M7 14l-4-4 1.41-1.41L7 11.17l7.59-7.59L16 5l-9 9z" />
                </svg>
                <span>Mark Attendance</span>
              </Link>
            )}

            {students.length > 0 && (
              <button
                type="button"
                style={{
                  ...styles.btn,
                  ...styles.btnCheckin,
                  ...(hoveredButton === 'checkin' ? styles.btnCheckinHover : {}),
                  ...(checkInActive ? styles.btnCheckinActive : {}),
                  position: 'relative',
                }}
                onClick={() => setOpenModal('checkIn')}
                {...hoverProps('checkin')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 11l2 2 4-4" />
                </svg>
                <span>{checkInActive ? 'Check-in Active' : 'Self Check-in'}</span>
                {checkInActive && <span style={styles.pulseBadge} aria-hidden="true" />}
              </button>
            )}

            <button
              type="button"
              style={{
                ...styles.btn,
                ...styles.btnEdit,
                ...(hoveredButton === 'edit' ? styles.btnEditHover : {}),
              }}
              onClick={() => setOpenModal('edit')}
              {...hoverProps('edit')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M0 14.25V18h3.75L14.81 6.94l-3.75-3.75L0 14.25zM17.71 4.04a1 1 0 000-1.41L15.37.29a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              <span>Edit Classroom</span>
            </button>

            <button
              type="button"
              style={{
                ...styles.btn,
                ...styles.btnDelete,
                ...(hoveredButton === 'delete' ? styles.btnDeleteHover : {}),
              }}
              onClick={handleDeleteClassroom}
              disabled={busy}
              {...hoverProps('delete')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14 2h-3.5l-1-1h-5l-1 1H0v2h14V2zM1 16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4H1v12z"
                />
              </svg>
              <span>Delete Classroom</span>
            </button>
          </div>
        </section>

        {defaulters.length > 0 && (
          <section style={styles.defaulterAlertCard} aria-labelledby="defaulters-title">
            <div style={styles.defaulterHeader}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                style={styles.defaulterIcon}
                aria-hidden="true"
              >
                <path
                  fill="#ef4444"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <h2 id="defaulters-title" style={styles.defaulterTitle}>
                Defaulter Warning (Attendance below {DEFAULTER_THRESHOLD}%)
              </h2>
            </div>
            <p style={styles.defaulterText}>
              The following students are currently at risk of attendance shortage:
            </p>
            <div style={styles.defaulterList}>
              {defaulters.map((student) => (
                <span key={student.id} style={styles.defaulterNameBadge}>
                  {student.name} ({student.percentage.toFixed(0)}%)
                </span>
              ))}
            </div>
          </section>
        )}

        {days > 0 && students.length > 0 && (
          <section style={styles.analyticsCard} aria-labelledby="analytics-title">
            <div style={styles.tableHeader}>
              <h2 id="analytics-title" style={styles.tableTitle}>
                Classroom Analytics
              </h2>
              <div style={styles.redBadge}>Live Insights</div>
            </div>

            <div style={styles.chartsGrid}>
              <figure style={styles.chartWrapper}>
                <figcaption style={styles.chartTitle}>Daily Attendance Trend (%)</figcaption>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e50914" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#e50914" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#8c8c8c" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8c8c8c" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip {...tooltipProps} />
                      <Area
                        type="monotone"
                        dataKey="attendance"
                        stroke="#e50914"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAttendance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </figure>

              <figure style={styles.chartWrapper}>
                <figcaption style={styles.chartTitle}>Individual Student Attendance (%)</figcaption>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={studentStats.map((student) => ({
                        name: student.name.split(' ')[0],
                        percentage: Math.round(student.percentage),
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke="#8c8c8c" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8c8c8c" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip {...tooltipProps} />
                      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                        {studentStats.map((student) => (
                          <Cell key={student.id} fill={student.tone.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </figure>
            </div>
          </section>
        )}

        {students.length === 0 ? (
          <section style={styles.alertCard}>
            <h2 style={styles.alertText}>No students in this classroom yet</h2>
            <p style={styles.alertSubtext}>
              Add students one by one or import a CSV roster to get started.
            </p>
          </section>
        ) : (
          <section
            className="classroom-table-card"
            style={styles.tableCard}
            aria-labelledby="students-title"
          >
            <div style={styles.tableHeader}>
              <h2 id="students-title" style={styles.tableTitle}>
                Students List
              </h2>
              <div style={styles.redBadge}>{students.length} Students</div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" style={styles.th}>
                      Name
                    </th>
                    <th scope="col" style={styles.th}>
                      Roll No.
                    </th>
                    <th scope="col" style={styles.th}>
                      Attendance
                    </th>
                    <th scope="col" style={styles.th}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.map((student, index) => (
                    <tr
                      key={student.id}
                      style={{
                        ...styles.tr,
                        ...(hoveredRow === student.id ? styles.trHover : {}),
                        animation: `fadeInUp 0.4s ease-out ${Math.min(index, 20) * 0.05}s backwards`,
                      }}
                      onMouseEnter={() => setHoveredRow(student.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={styles.td}>
                        <div style={styles.studentName}>
                          <div style={styles.avatar} aria-hidden="true">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.rollBadge}>{student.roll}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.attendanceWrapper}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ ...styles.attendanceText, color: student.tone.color }}>
                              {student.attendance}/{days}
                            </span>
                            <span
                              style={{
                                ...styles.percentBadge,
                                color: student.tone.color,
                                borderColor: student.tone.color,
                              }}
                            >
                              {student.percentage.toFixed(0)}%
                            </span>
                          </div>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                background: student.tone.gradient,
                                width: `${clampPercentage(student.percentage)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          aria-label={`Remove ${student.name}`}
                          title="Remove student"
                          style={{
                            ...styles.btnTableDelete,
                            ...(hoveredButton === `delete-${student.id}`
                              ? styles.btnTableDeleteHover
                              : {}),
                          }}
                          onClick={() => handleDeleteStudent(student)}
                          disabled={busy}
                          {...hoverProps(`delete-${student.id}`)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                            <path
                              fill="currentColor"
                              fillRule="evenodd"
                              d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6zM14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section style={styles.historyCard} aria-labelledby="history-title">
          <div style={styles.tableHeader}>
            <h2 id="history-title" style={styles.tableTitle}>
              Attendance History Logs
            </h2>
            <div style={styles.blueBadge}>{sessions.length} Days Marked</div>
          </div>

          {sessions.length === 0 ? (
            <div style={styles.noHistoryWrapper}>
              <p style={styles.noHistoryText}>No attendance sessions recorded yet.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" style={styles.th}>
                      Date
                    </th>
                    <th scope="col" style={styles.th}>
                      Present / Total Students
                    </th>
                    <th scope="col" style={styles.th}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const rowKey = `history-${session.date}`;
                    const percent =
                      session.totalCount > 0
                        ? (session.presentCount / session.totalCount) * 100
                        : 0;
                    return (
                      <tr
                        key={session.date}
                        style={{ ...styles.tr, ...(hoveredRow === rowKey ? styles.trHover : {}) }}
                        onMouseEnter={() => setHoveredRow(rowKey)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={styles.td}>
                          <span style={styles.dateText}>{session.date}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.attendanceWrapper}>
                            <span style={styles.attendanceText}>
                              {session.presentCount} / {session.totalCount} present
                            </span>
                            <div style={styles.progressBar}>
                              <div
                                style={{
                                  ...styles.progressFill,
                                  width: `${clampPercentage(percent)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <Link
                            to={ROUTES.markAttendance(classroomId, session.date)}
                            style={{
                              ...styles.btnEditHistory,
                              ...(hoveredButton === rowKey ? styles.btnEditHistoryHover : {}),
                            }}
                            {...hoverProps(rowKey)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                fill="currentColor"
                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                              />
                            </svg>
                            <span>Edit Session</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const card = {
  background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
  borderRadius: '20px',
  padding: '30px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const pill = (rgb) => ({
  background: `rgba(${rgb}, 0.2)`,
  border: `1px solid rgba(${rgb}, 0.3)`,
  padding: '8px 16px',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: '600',
  color: `rgb(${rgb})`,
  letterSpacing: '0.5px',
});

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    fontFamily: "'Poppins', sans-serif",
    width: '100%',
  },
  container: { padding: '40px 20px', maxWidth: '1400px', width: '100%', margin: '0 auto' },
  roomCard: {
    ...card,
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(229, 9, 20, 0.2)',
    marginBottom: '40px',
    animation: 'fadeInUp 0.6s ease-out',
  },
  roomHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  roomBadge: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #e50914 0%, #ff4757 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.4)',
  },
  roomCode: {
    fontSize: '42px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #e50914 0%, #ff4757 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '1px',
    wordBreak: 'break-word',
  },
  roomName: {
    fontSize: '28px',
    color: '#fff',
    marginBottom: '30px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  roomStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '20px 30px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  statContent: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' },
  statLabel: { fontSize: '13px', color: '#8c8c8c', fontWeight: '500', letterSpacing: '0.5px' },
  statValue: { fontSize: '24px', color: '#fff', fontWeight: '700' },
  roomActions: { display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    letterSpacing: '0.3px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Poppins', sans-serif",
    color: '#fff',
  },
  btnAdd: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
  },
  btnAddHover: { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)' },
  btnMark: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
  },
  btnMarkHover: { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(245, 158, 11, 0.5)' },
  btnEdit: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
  },
  btnEditHover: { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(59, 130, 246, 0.5)' },
  btnDelete: {
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    boxShadow: '0 4px 20px rgba(229, 9, 20, 0.3)',
  },
  btnDeleteHover: { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(229, 9, 20, 0.5)' },
  btnCheckin: {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
  },
  btnCheckinHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(6, 182, 212, 0.5)',
  },
  btnCheckinActive: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
  },
  pulseBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    boxShadow: '0 0 8px #ef4444',
    animation: 'statusPulse 2s ease-in-out infinite',
  },
  defaulterAlertCard: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    animation: 'fadeInUp 0.6s ease-out',
  },
  defaulterHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  defaulterIcon: { flexShrink: 0, animation: 'pulse 2s infinite' },
  defaulterTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ef4444',
    margin: 0,
    letterSpacing: '0.5px',
  },
  defaulterText: { fontSize: '14px', color: '#d1d5db', margin: '0 0 16px 0', lineHeight: '1.5' },
  defaulterList: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  defaulterNameBadge: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  analyticsCard: {
    ...card,
    marginBottom: '30px',
    animation: 'fadeInUp 0.6s ease-out 0.1s backwards',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    marginTop: '20px',
  },
  chartWrapper: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    margin: 0,
  },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: '#e0e0e0', marginBottom: '15px' },
  tableCard: { ...card, animation: 'fadeInUp 0.6s ease-out 0.2s backwards' },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  tableTitle: {
    fontSize: '24px',
    color: '#fff',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  redBadge: pill('229, 9, 20'),
  blueBadge: pill('59, 130, 246'),
  tableWrapper: { overflowX: 'auto', borderRadius: '12px' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  th: {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.02)',
    whiteSpace: 'nowrap',
  },
  tr: { transition: 'all 0.3s ease' },
  trHover: { background: 'rgba(255, 255, 255, 0.03)' },
  td: {
    padding: '20px',
    fontSize: '15px',
    color: '#e0e0e0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  studentName: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #e50914 0%, #ff4757 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
    color: '#fff',
    flexShrink: 0,
  },
  rollBadge: {
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    display: 'inline-block',
  },
  attendanceWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
  attendanceText: { fontWeight: '600', color: '#10b981', fontSize: '15px' },
  percentBadge: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  progressBar: {
    width: '100px',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    transition: 'width 0.6s ease',
    borderRadius: '3px',
  },
  btnTableDelete: {
    background: 'rgba(229, 9, 20, 0.1)',
    border: '1px solid rgba(229, 9, 20, 0.3)',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#e50914',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTableDeleteHover: { background: 'rgba(229, 9, 20, 0.2)', transform: 'scale(1.1)' },
  alertCard: {
    ...card,
    padding: '60px 40px',
    textAlign: 'center',
    border: '1px solid rgba(229, 9, 20, 0.2)',
    animation: 'fadeInUp 0.6s ease-out',
  },
  alertText: { fontSize: '24px', color: '#e50914', marginBottom: '10px', fontWeight: '600' },
  alertSubtext: { color: '#8c8c8c', fontSize: '16px' },
  historyCard: { ...card, marginTop: '40px', animation: 'fadeInUp 0.6s ease-out 0.3s backwards' },
  noHistoryWrapper: { padding: '40px 20px', textAlign: 'center', color: '#8c8c8c' },
  noHistoryText: { fontSize: '16px', fontWeight: '500', margin: 0 },
  dateText: { fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' },
  btnEditHistory: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    padding: '8px 14px',
    borderRadius: '6px',
    color: '#f59e0b',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
  btnEditHistoryHover: {
    background: 'rgba(245, 158, 11, 0.2)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.15)',
  },
};
