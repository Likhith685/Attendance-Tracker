import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage, isCancelledRequest } from '../api/client';
import { studentApi } from '../api/student';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/useAuth';
import { attendancePercentage, clampPercentage, getAttendanceTone } from '../utils/attendance';
import { ROUTES } from '../utils/routes';

const BADGE_STYLES = {
  good: { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' },
  warning: { background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' },
  danger: { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' },
};

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState({});

  const fetchDashboard = useCallback(
    (signal) =>
      studentApi.dashboard({ signal }).then(
        (data) => {
          setClassrooms(data.classrooms);
          setError('');
          setStatus('ready');
          setRefreshing(false);
        },
        (err) => {
          if (isCancelledRequest(err)) return;
          setError(getErrorMessage(err, 'Failed to load your dashboard.'));
          setStatus('error');
          setRefreshing(false);
        },
      ),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    return () => controller.abort();
  }, [fetchDashboard]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.landing, { replace: true });
  };

  if (status === 'loading')
    return <PageLoader message="Loading your student portal..." color="#3b82f6" />;

  const totalDays = classrooms.reduce((sum, room) => sum + room.days, 0);
  const totalAttended = classrooms.reduce((sum, room) => sum + room.attendance, 0);
  const overall = attendancePercentage(totalAttended, totalDays);
  const overallTone = getAttendanceTone(overall);

  return (
    <div className="student-dashboard-page-wrapper" style={styles.pageWrapper}>
      <div className="student-dashboard-container" style={styles.container}>
        <header className="student-dashboard-header-card" style={styles.headerCard}>
          <div style={styles.headerInfo}>
            <div style={styles.avatar} aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h1 style={styles.studentTitle}>Student Attendance Portal</h1>
              <p style={styles.studentSubtitle}>
                Roll Number: <strong style={{ color: '#3b82f6' }}>{user.roll}</strong>
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              type="button"
              style={styles.btnRefresh}
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                fetchDashboard();
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button type="button" onClick={handleLogout} style={styles.btnLogout}>
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" style={styles.errorAlert}>
            {error}
          </div>
        )}

        {status === 'ready' && classrooms.length === 0 && (
          <div style={styles.emptyStateCard}>
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              style={{ marginBottom: '20px' }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 style={styles.emptyTitle}>No Classrooms Found</h2>
            <p style={styles.emptyText}>
              You are not enrolled in any classrooms yet. Ask your teacher to add your roll number (
              <strong style={{ color: '#fff' }}>{user.roll}</strong>) to their class roster.
            </p>
          </div>
        )}

        {classrooms.length > 0 && (
          <>
            <div className="student-dashboard-stats-grid" style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper} aria-hidden="true">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <span style={styles.statLabel}>Enrolled Courses</span>
                  <span style={styles.statValue}>{classrooms.length}</span>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper} aria-hidden="true">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={overallTone.color}
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <span style={styles.statLabel}>Overall Attendance</span>
                  <span style={{ ...styles.statValue, color: overallTone.color }}>
                    {overall.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <h2 style={styles.sectionTitle}>Your Courses</h2>
            <div className="student-dashboard-courses-grid" style={styles.coursesGrid}>
              {classrooms.map((room) => {
                const tone = getAttendanceTone(room.percentage);
                const isExpanded = Boolean(expandedLogs[room.id]);
                const logsId = `logs-${room.id}`;

                return (
                  <article key={room.id} style={styles.courseCard}>
                    <div style={styles.cardHeader}>
                      <div>
                        <span style={styles.courseCode}>{room.ccode}</span>
                        <h3 style={styles.courseName}>{room.cname}</h3>
                      </div>
                      <span
                        style={{ ...styles.badge, ...BADGE_STYLES[tone.tone], color: tone.color }}
                      >
                        {tone.label}
                      </span>
                    </div>

                    <div style={styles.attendanceSummary}>
                      <span style={{ color: '#aaa' }}>Attendance Rate:</span>
                      <strong style={{ color: tone.color, fontSize: '18px' }}>
                        {room.attendance} / {room.days} ({room.percentage.toFixed(0)}%)
                      </strong>
                    </div>

                    <div
                      style={styles.progressBar}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(clampPercentage(room.percentage))}
                      aria-label={`${room.cname} attendance`}
                    >
                      <div
                        style={{
                          ...styles.progressFill,
                          background: tone.gradient,
                          width: `${clampPercentage(room.percentage)}%`,
                        }}
                      />
                    </div>

                    <div style={styles.cardActions}>
                      {room.checkIn.active && (
                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.studentCheckIn(room.id))}
                          style={styles.btnCardCheckIn}
                        >
                          <span style={styles.pulseDot} aria-hidden="true" />
                          <span>Check-in Active</span>
                        </button>
                      )}
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={logsId}
                        onClick={() =>
                          setExpandedLogs((current) => ({
                            ...current,
                            [room.id]: !current[room.id],
                          }))
                        }
                        style={{
                          ...styles.btnAccordion,
                          color: isExpanded ? '#3b82f6' : '#b3b3b3',
                          background: isExpanded
                            ? 'rgba(59, 130, 246, 0.08)'
                            : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span>{isExpanded ? 'Hide Logs' : 'View Logs'}</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden="true"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {isExpanded && (
                      <div id={logsId} style={styles.logsWrapper}>
                        {room.logs.length === 0 ? (
                          <p style={styles.noLogs}>No attendance sessions recorded yet.</p>
                        ) : (
                          <ul style={styles.logsList}>
                            {room.logs.map((log) => {
                              const present = log.status === 'Present';
                              return (
                                <li key={log.date} style={styles.logItem}>
                                  <span style={styles.logDate}>{log.date}</span>
                                  <span
                                    style={{
                                      ...styles.logStatus,
                                      color: present ? '#10b981' : '#ef4444',
                                      background: present
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(239, 68, 68, 0.1)',
                                      border: `1px solid ${present ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                    }}
                                  >
                                    {log.status}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cardBase = {
  background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    color: '#fff',
    fontFamily: "'Poppins', sans-serif",
    width: '100%',
  },
  container: { maxWidth: '1100px', width: '100%', padding: '40px 20px', margin: '0 auto' },
  headerCard: {
    ...cardBase,
    borderRadius: '20px',
    padding: '25px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    marginBottom: '35px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '18px', textAlign: 'left' },
  headerActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3b82f6',
    flexShrink: 0,
  },
  studentTitle: { fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' },
  studentSubtitle: { fontSize: '14px', color: '#aaa', margin: '4px 0 0 0' },
  btnRefresh: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
  },
  btnLogout: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
  },
  errorAlert: {
    padding: '15px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    marginBottom: '25px',
  },
  emptyStateCard: { ...cardBase, borderRadius: '20px', padding: '60px 40px', textAlign: 'center' },
  emptyTitle: { fontSize: '20px', color: '#fff', margin: '0 0 10px 0', fontWeight: '600' },
  emptyText: {
    color: '#8c8c8c',
    fontSize: '14px',
    maxWidth: '500px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '35px',
  },
  statCard: {
    ...cardBase,
    padding: '20px 25px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  statIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  statLabel: { fontSize: '12px', color: '#8c8c8c', fontWeight: '500' },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#fff',
    display: 'block',
    marginTop: '2px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    letterSpacing: '-0.5px',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
  },
  courseCard: {
    ...cardBase,
    borderRadius: '20px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '15px',
  },
  courseCode: {
    fontSize: '12px',
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  courseName: { fontSize: '18px', fontWeight: '700', margin: '4px 0 0 0', color: '#fff' },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  attendanceSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
    fontSize: '14px',
    marginBottom: '10px',
  },
  progressBar: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease-in-out' },
  cardActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnAccordion: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },
  btnCardCheckIn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
    fontFamily: "'Poppins', sans-serif",
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
    animation: 'statusPulse 2s ease-in-out infinite',
  },
  logsWrapper: {
    marginTop: '15px',
    padding: '15px 5px 0 5px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  noLogs: { color: '#8c8c8c', fontSize: '13px', margin: 0, textAlign: 'center' },
  logsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  logDate: { fontSize: '13px', color: '#d1d5db' },
  logStatus: { fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px' },
};
