import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { classroomsApi } from '../api/classrooms';
import { getErrorMessage, isCancelledRequest, isNotFoundError } from '../api/client';
import BackButton from '../components/BackButton';
import PageLoader from '../components/PageLoader';
import { Spinner } from '../components/icons';
import { isIsoDateString, toLocalDateString } from '../utils/date';
import { ROUTES } from '../utils/routes';

const PRESENT = 'Present';
const ABSENT = 'Absent';

/** Remounts the page when the classroom id changes so no stale data is shown. */
export default function MarkAttendancePage() {
  const { id } = useParams();
  return <MarkAttendance key={id} classroomId={id} />;
}

function MarkAttendance({ classroomId }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = toLocalDateString();
  const requestedDate = searchParams.get('date');
  const date = isIsoDateString(requestedDate) && requestedDate <= today ? requestedDate : today;

  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error | notFound
  const [error, setError] = useState('');
  // Statuses for `loadedSession.date`; students missing from the map are absent.
  const [statuses, setStatuses] = useState({});
  const [loadedSession, setLoadedSession] = useState({ date: null, exists: false });
  const [submitting, setSubmitting] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      classroomsApi.get(classroomId, { signal }),
      classroomsApi.listStudents(classroomId, { signal }),
    ]).then(
      ([room, roster]) => {
        setClassroom(room);
        setStudents(roster);
        setStatus('ready');
      },
      (err) => {
        if (isCancelledRequest(err)) return;
        if (isNotFoundError(err)) {
          setStatus('notFound');
        } else {
          setError(getErrorMessage(err, 'Could not load the attendance sheet.'));
          setStatus('error');
        }
      },
    );
    return () => controller.abort();
  }, [classroomId]);

  useEffect(() => {
    if (status !== 'ready') return undefined;

    const controller = new AbortController();
    classroomsApi.getSession(classroomId, date, { signal: controller.signal }).then(
      (session) => {
        setStatuses(
          Object.fromEntries(session.records.map((record) => [record.studentId, record.status])),
        );
        setLoadedSession({ date, exists: true });
      },
      (err) => {
        if (isCancelledRequest(err)) return;
        if (!isNotFoundError(err)) {
          toast.error(getErrorMessage(err, 'Could not load attendance for this date.'));
        }
        setStatuses({});
        setLoadedSession({ date, exists: false });
      },
    );
    return () => controller.abort();
  }, [classroomId, date, status]);

  const sessionReady = loadedSession.date === date;
  const statusOf = (studentId) => statuses[studentId] ?? ABSENT;

  const presentCount = useMemo(
    () => students.filter((student) => statuses[student.id] === PRESENT).length,
    [students, statuses],
  );
  const absentCount = students.length - presentCount;
  const attendancePercentage =
    students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const toggle = (studentId) =>
    setStatuses((current) => ({
      ...current,
      [studentId]: (current[studentId] ?? ABSENT) === PRESENT ? ABSENT : PRESENT,
    }));

  const handleDateChange = (event) => {
    const value = event.target.value;
    if (isIsoDateString(value) && value <= today)
      setSearchParams({ date: value }, { replace: true });
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const session = await classroomsApi.saveSession(
        classroomId,
        date,
        students.map((student) => ({ studentId: student.id, status: statusOf(student.id) })),
      );
      toast.success(
        session.created ? 'Attendance marked successfully!' : 'Attendance updated successfully!',
      );
      navigate(ROUTES.classroom(classroomId));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save attendance.'));
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <PageLoader message="Loading attendance sheet..." />;

  if (status !== 'ready') {
    return (
      <div style={styles.container}>
        <div role="alert" style={styles.headerCard}>
          <h1 style={styles.title}>
            {status === 'notFound' ? 'Classroom not found' : 'Something went wrong'}
          </h1>
          <p style={styles.noteText}>
            {status === 'notFound' ? 'This classroom does not exist or is not yours.' : error}
          </p>
          <Link
            to={ROUTES.teacherHome}
            style={{ ...styles.confbtn, display: 'inline-flex', marginTop: '24px' }}
          >
            Back to your classrooms
          </Link>
        </div>
      </div>
    );
  }

  const hoverProps = (key) => ({
    onMouseEnter: () => setHoveredButton(key),
    onMouseLeave: () => setHoveredButton(null),
  });

  return (
    <div className="mark-att-container" style={styles.container}>
      <BackButton onClick={() => navigate(ROUTES.classroom(classroomId))}>
        Back to Classroom
      </BackButton>

      <section className="mark-att-header-card" style={styles.headerCard}>
        <h1 style={styles.title}>{classroom.cname}</h1>

        <div style={styles.dateSelectorContainer}>
          <label style={styles.dateLabel} htmlFor="attendance-date">
            Attendance Session Date:
          </label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            max={today}
            onChange={handleDateChange}
            style={styles.dateInput}
            className="date-input"
          />
          {sessionReady && loadedSession.exists && (
            <p style={styles.editingBadge}>
              ⚠️ Attendance for this date was already marked. Saving will update it.
            </p>
          )}
        </div>

        <div className="mark-att-stats-container" style={styles.statsContainer} aria-live="polite">
          <div style={styles.statBox}>
            <span style={styles.statValue}>{students.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: '#10b981' }}>{presentCount}</span>
            <span style={styles.statLabel}>Present</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: '#ef4444' }}>{absentCount}</span>
            <span style={styles.statLabel}>Absent</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: '#3b82f6' }}>{attendancePercentage}%</span>
            <span style={styles.statLabel}>Attendance</span>
          </div>
        </div>
      </section>

      {students.length === 0 ? (
        <section style={styles.tableCard}>
          <h2 style={styles.tableTitle}>No students yet</h2>
          <p style={{ ...styles.noteText, marginTop: '10px' }}>
            Add students to this classroom before marking attendance.
          </p>
          <Link
            to={ROUTES.classroom(classroomId)}
            style={{ ...styles.confbtn, display: 'inline-flex', marginTop: '20px' }}
          >
            Go to classroom
          </Link>
        </section>
      ) : (
        <>
          <section
            className="mark-att-table-card"
            style={styles.tableCard}
            aria-labelledby="attendance-table-title"
            aria-busy={!sessionReady}
          >
            <div style={styles.tableHeader}>
              <h2 id="attendance-table-title" style={styles.tableTitle}>
                Student Attendance
              </h2>
              <div style={styles.tableBadge}>{students.length} Students</div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={{ ...styles.table, opacity: sessionReady ? 1 : 0.5 }}>
                <thead>
                  <tr>
                    <th scope="col" style={styles.th}>
                      Name
                    </th>
                    <th scope="col" style={styles.th}>
                      Roll No.
                    </th>
                    <th scope="col" style={styles.th}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const present = statusOf(student.id) === PRESENT;
                    const buttonKey = `toggle-${student.id}`;
                    return (
                      <tr
                        key={student.id}
                        style={{
                          ...styles.tr,
                          ...(hoveredRow === student.id ? styles.trHover : {}),
                        }}
                        onMouseEnter={() => setHoveredRow(student.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={styles.td}>
                          <div style={styles.studentName}>
                            <div
                              aria-hidden="true"
                              style={{
                                ...styles.avatar,
                                ...(present ? styles.avatarPresent : styles.avatarAbsent),
                              }}
                            >
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.rollBadge}>{student.roll}</span>
                        </td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={present}
                            aria-label={`${student.name} is ${present ? 'present' : 'absent'}`}
                            disabled={!sessionReady || submitting}
                            style={{
                              ...(present ? styles.presentBtn : styles.absentBtn),
                              ...(hoveredButton === buttonKey ? styles.statusBtnHover : {}),
                            }}
                            onClick={() => toggle(student.id)}
                            {...hoverProps(buttonKey)}
                          >
                            {present ? 'Present' : 'Absent'}
                            <span style={styles.toggleHint}>tap to change</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div style={styles.footerSection}>
            <div style={styles.noteCard}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0 }}
                aria-hidden="true"
              >
                <path
                  fill="#f59e0b"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <div>
                <p style={styles.noteTitle}>Important</p>
                <p style={styles.noteText}>
                  Confirm once attendance is final. Students marked absent receive an email
                  notification.
                </p>
              </div>
            </div>

            <button
              type="button"
              style={{
                ...styles.confbtn,
                ...(hoveredButton === 'confirm' ? styles.confbtnHover : {}),
                ...(submitting || !sessionReady ? styles.confbtnDisabled : {}),
              }}
              onClick={handleConfirm}
              disabled={submitting || !sessionReady}
              {...hoverProps('confirm')}
            >
              {submitting ? (
                <>
                  <Spinner size={20} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{loadedSession.exists ? 'Update Attendance' : 'Confirm Attendance'}</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const statusButton = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '130px',
  border: 'none',
  padding: '8px 20px',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
  lineHeight: 1.3,
  transition: 'all 0.3s ease',
  fontFamily: "'Poppins', sans-serif",
};

const styles = {
  container: {
    padding: '40px 20px',
    fontFamily: "'Poppins', sans-serif",
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  headerCard: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(229, 9, 20, 0.2)',
    marginBottom: '40px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeInUp 0.6s ease-out',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #e50914 0%, #ff4757 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '10px',
    letterSpacing: '0.5px',
  },
  dateSelectorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    marginBottom: '20px',
  },
  dateLabel: { color: '#b3b3b3', fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' },
  dateInput: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '10px 20px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontFamily: "'Poppins', sans-serif",
    outline: 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    colorScheme: 'dark',
  },
  editingBadge: { color: '#f59e0b', fontSize: '13px', fontWeight: '500', margin: '5px 0 0 0' },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap',
    marginTop: '30px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px 30px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    minWidth: '120px',
  },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#fff' },
  statLabel: {
    fontSize: '13px',
    color: '#8c8c8c',
    fontWeight: '500',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  tableCard: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeInUp 0.6s ease-out 0.2s backwards',
    marginBottom: '30px',
  },
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
  tableBadge: {
    background: 'rgba(229, 9, 20, 0.2)',
    border: '1px solid rgba(229, 9, 20, 0.3)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e50914',
  },
  tableWrapper: { overflowX: 'auto', borderRadius: '12px' },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    transition: 'opacity 0.2s ease',
  },
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
  },
  tr: { transition: 'all 0.3s ease' },
  trHover: { background: 'rgba(255, 255, 255, 0.03)' },
  td: {
    padding: '16px 20px',
    fontSize: '15px',
    color: '#e0e0e0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  studentName: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
    color: '#fff',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  avatarAbsent: { background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' },
  avatarPresent: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
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
  presentBtn: {
    ...statusButton,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
  },
  absentBtn: {
    ...statusButton,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
  },
  statusBtnHover: { transform: 'translateY(-2px)' },
  toggleHint: {
    fontSize: '10px',
    fontWeight: '400',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeInUp 0.6s ease-out 0.4s backwards',
  },
  noteCard: {
    display: 'flex',
    gap: '15px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'left',
  },
  noteTitle: { fontSize: '16px', fontWeight: '600', color: '#f59e0b', marginBottom: '5px' },
  noteText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', margin: 0 },
  confbtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    border: 'none',
    padding: '18px 40px',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '18px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 30px rgba(229, 9, 20, 0.4)',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    letterSpacing: '0.5px',
    fontFamily: "'Poppins', sans-serif",
  },
  confbtnHover: { transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(229, 9, 20, 0.6)' },
  confbtnDisabled: { opacity: 0.7, cursor: 'not-allowed', transform: 'none' },
};
