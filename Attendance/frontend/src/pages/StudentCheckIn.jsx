import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage, isCancelledRequest, isNotFoundError } from '../api/client';
import { studentApi } from '../api/student';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { formatCountdown } from '../utils/date';
import { getCurrentPosition } from '../utils/geolocation';
import { ROUTES } from '../utils/routes';

/** Remounts the page when the classroom id changes so no stale data is shown. */
export default function StudentCheckInPage() {
  const { id } = useParams();
  return <StudentCheckIn key={id} classroomId={id} />;
}

function StudentCheckIn({ classroomId }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const checkIn = classroom?.checkIn;
  const secondsLeft = useCountdown(checkIn?.active ? checkIn.expiresAt : null);
  const sessionOpen = Boolean(checkIn?.active) && secondsLeft > 0;

  const acquireLocation = useCallback(async () => {
    setLocating(true);
    setLocationError('');
    try {
      setCoords(await getCurrentPosition());
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocating(false);
    }
  }, []);

  const loadClassroom = useCallback(
    (signal) =>
      studentApi.getClassroom(classroomId, { signal }).then(
        (room) => {
          setClassroom(room);
          setStatus('ready');
          // Only ask for location permission when this session actually requires it.
          if (room.checkIn.active && room.checkIn.locationRequired) acquireLocation();
        },
        (err) => {
          if (isCancelledRequest(err)) return;
          setLoadError(
            isNotFoundError(err)
              ? 'This classroom was not found, or you are not enrolled in it.'
              : getErrorMessage(err, 'Failed to load the classroom.'),
          );
          setStatus('error');
        },
      ),
    [classroomId, acquireLocation],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadClassroom(controller.signal);
    return () => controller.abort();
  }, [loadClassroom]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setErrorMsg('Please enter the 6-digit PIN shown by your teacher.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      setResult(await studentApi.checkIn(classroomId, { code, ...(coords ?? {}) }));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Check-in failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <PageLoader message="Loading check-in page..." />;

  const backToDashboard = () => navigate(ROUTES.studentDashboard);

  return (
    <div className="student-checkin-page-wrapper" style={styles.pageWrapper}>
      <div className="student-checkin-container" style={styles.container}>
        <button type="button" style={styles.btnBack} onClick={backToDashboard}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fill="currentColor"
              d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 1.414L4.414 10l6.293 6.293A1 1 0 0110 18z"
            />
          </svg>
          <span>Dashboard</span>
        </button>

        <main className="student-checkin-card" style={styles.card}>
          {status === 'error' ? (
            <div role="alert" style={styles.centered}>
              <h1 style={styles.title}>Unable to check in</h1>
              <p style={styles.mutedText}>{loadError}</p>
              <button type="button" style={styles.btnSecondary} onClick={backToDashboard}>
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div style={styles.header}>
                <h1 style={styles.title}>Self Check-in</h1>
                <div style={styles.badge}>{classroom.ccode}</div>
              </div>
              <p style={styles.subtitle}>
                Checking in to: <strong style={{ color: '#fff' }}>{classroom.cname}</strong>
              </p>
              <div style={styles.divider} />

              {result ? (
                <div style={styles.centered} role="status">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    style={styles.successIcon}
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h2 style={styles.successTitle}>
                    {result.alreadyCheckedIn ? 'Already Checked In' : 'Attendance Marked!'}
                  </h2>
                  <p style={styles.mutedText}>{result.message}</p>
                  <button type="button" style={styles.btnSecondary} onClick={backToDashboard}>
                    Go to Dashboard
                  </button>
                </div>
              ) : !sessionOpen ? (
                <div style={styles.centered}>
                  <h2 style={styles.closedTitle}>No active check-in session</h2>
                  <p style={styles.mutedText}>
                    {checkIn?.active
                      ? 'This check-in session has just ended.'
                      : 'Your teacher has not started a check-in for this class, or it has already ended.'}
                  </p>
                  <button
                    type="button"
                    style={styles.btnSecondary}
                    onClick={() => {
                      setStatus('loading');
                      loadClassroom();
                    }}
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={styles.form} noValidate>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Marking attendance for</span>
                    <span style={styles.infoValue}>Roll {user.roll}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Session closes in</span>
                    <span
                      style={{ ...styles.infoValue, color: '#ef4444', fontFamily: 'monospace' }}
                    >
                      {formatCountdown(secondsLeft)}
                    </span>
                  </div>

                  {checkIn.locationRequired && (
                    <div style={styles.locContainer} aria-live="polite">
                      <div style={styles.locHeader}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={coords ? '#10b981' : '#8c8c8c'}
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span style={styles.locTitle}>GPS Location Verification</span>
                      </div>
                      <div style={styles.locContent}>
                        {locating ? (
                          <span style={styles.mutedText}>Getting your location...</span>
                        ) : coords ? (
                          <span style={styles.locSuccess}>Location acquired</span>
                        ) : (
                          <span style={styles.locError}>
                            {locationError || 'Location access is required.'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={acquireLocation}
                          style={styles.btnLink}
                          disabled={locating}
                        >
                          {coords ? 'Refresh location' : 'Share location'}
                        </button>
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div role="alert" style={styles.errorAlert}>
                      {errorMsg}
                    </div>
                  )}

                  <div style={styles.formGroup}>
                    <label htmlFor="pin-input" style={styles.inputLabel}>
                      Enter the 6-digit check-in PIN
                    </label>
                    <input
                      id="pin-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      style={styles.inputField}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                      disabled={submitting}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ ...styles.btnSubmit, opacity: submitting ? 0.7 : 1 }}
                    disabled={submitting || (checkIn.locationRequired && !coords)}
                  >
                    {submitting ? 'Verifying check-in...' : 'Submit Check-in'}
                  </button>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    color: '#fff',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Poppins', sans-serif",
  },
  container: { width: '100%', maxWidth: '500px', marginTop: '20px' },
  btnBack: {
    background: 'none',
    border: 'none',
    color: '#8c8c8c',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '20px',
    padding: 0,
  },
  card: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '35px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: '600', color: '#fff', letterSpacing: '0.5px' },
  badge: {
    background: 'rgba(229, 9, 20, 0.2)',
    border: '1px solid rgba(229, 9, 20, 0.3)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#e50914',
  },
  subtitle: { margin: '0 0 20px 0', color: '#8c8c8c', fontSize: '15px' },
  divider: { height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '12px 18px',
    borderRadius: '10px',
    fontSize: '14px',
  },
  infoLabel: { color: '#8c8c8c' },
  infoValue: { fontWeight: '600', color: '#3b82f6' },
  locContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '15px 18px',
  },
  locHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  locTitle: { fontSize: '14px', fontWeight: '600', color: '#e0e0e0' },
  locContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    gap: '10px',
  },
  locSuccess: { color: '#10b981', fontWeight: '500' },
  locError: { color: '#ef4444', fontWeight: '500' },
  btnLink: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    padding: 0,
    flexShrink: 0,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inputLabel: { fontSize: '14px', color: '#d4d4d4', fontWeight: '500' },
  inputField: {
    backgroundColor: '#1c1c1c',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '14px',
    color: '#fff',
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: '8px',
    fontFamily: 'monospace',
    outline: 'none',
  },
  btnSubmit: {
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(229, 9, 20, 0.3)',
    marginTop: '10px',
    fontFamily: "'Poppins', sans-serif",
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 0',
    gap: '15px',
  },
  successIcon: { filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))' },
  successTitle: { margin: 0, fontSize: '20px', color: '#10b981', fontWeight: '600' },
  closedTitle: { margin: 0, fontSize: '20px', color: '#f59e0b', fontWeight: '600' },
  mutedText: { margin: 0, color: '#a3a3a3', fontSize: '15px', lineHeight: '1.5' },
  btnSecondary: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    marginTop: '10px',
    fontFamily: "'Poppins', sans-serif",
  },
};
