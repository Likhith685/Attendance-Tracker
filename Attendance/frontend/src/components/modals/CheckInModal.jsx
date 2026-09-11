import { useState } from 'react';
import { toast } from 'react-toastify';
import { classroomsApi } from '../../api/classrooms';
import { getErrorMessage } from '../../api/client';
import { useCountdown } from '../../hooks/useCountdown';
import { formatCountdown, toLocalDateString } from '../../utils/date';
import { getCurrentPosition } from '../../utils/geolocation';
import { Spinner } from '../icons';
import Modal from '../Modal';

const DURATIONS = [2, 5, 10, 15];

/** Lets a teacher start, monitor and stop a PIN-based self check-in session. */
export default function CheckInModal({ open, onClose, classroom, onChange }) {
  const { checkIn } = classroom;
  const secondsLeft = useCountdown(checkIn.active ? checkIn.expiresAt : null);
  const active = checkIn.active && secondsLeft > 0;

  const [duration, setDuration] = useState(5);
  const [requireLocation, setRequireLocation] = useState(true);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [busy, setBusy] = useState(false);

  const acquireLocation = async () => {
    setLocating(true);
    setLocationError('');
    try {
      setCoords(await getCurrentPosition());
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocating(false);
    }
  };

  const startSession = async () => {
    if (requireLocation && !coords) {
      setLocationError('Location is required to start a location-verified session.');
      return;
    }
    setBusy(true);
    try {
      const session = await classroomsApi.startCheckIn(classroom.id, {
        durationMinutes: duration,
        date: toLocalDateString(),
        ...(requireLocation ? coords : {}),
      });
      onChange(session);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to start the check-in session.'));
    } finally {
      setBusy(false);
    }
  };

  const stopSession = async () => {
    setBusy(true);
    try {
      await classroomsApi.stopCheckIn(classroom.id);
      onChange({ active: false, expiresAt: null, date: null, locationRequired: false });
      toast.success('Check-in session stopped.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to stop the check-in session.'));
    } finally {
      setBusy(false);
    }
  };

  const startDisabled = busy || (requireLocation && !coords);

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="checkin-title"
      accent="rgba(6, 182, 212, 0.3)"
      padding="30px"
    >
      <div style={styles.header}>
        <h3 id="checkin-title" style={styles.title}>
          Self Check-in Portal
        </h3>
      </div>

      {active ? (
        <div style={styles.activeContainer}>
          <div style={styles.activePill}>
            <div style={styles.pulseDot} aria-hidden="true" />
            <span style={styles.activeText}>Check-in Session Active</span>
          </div>

          <p style={styles.subtext}>Ask students to open their dashboard and enter this PIN:</p>

          <div style={styles.codeWrapper}>
            <div style={styles.codeLabel}>6-Digit PIN</div>
            <div style={styles.codeDisplay} aria-live="polite">
              {checkIn.code}
            </div>
          </div>

          <div style={styles.timerWrapper} role="timer" aria-live="off">
            <span style={styles.timerLabel}>Time Remaining:</span>
            <span style={styles.timerValue}>{formatCountdown(secondsLeft)}</span>
          </div>
          {checkIn.locationRequired && (
            <p style={styles.hint}>Students must be close to your location to check in.</p>
          )}

          <button
            type="button"
            style={{ ...styles.button, ...styles.stopButton }}
            onClick={stopSession}
            disabled={busy}
          >
            {busy ? <Spinner /> : null}
            Stop Check-in Session
          </button>
        </div>
      ) : (
        <div style={styles.setupContainer}>
          <p style={styles.subtext}>
            Open a short check-in window. Students enter the PIN from their own devices.
          </p>

          <div style={styles.formGroup}>
            <label htmlFor="checkin-duration" style={styles.fieldLabel}>
              Session Duration
            </label>
            <select
              id="checkin-duration"
              style={styles.select}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} Minutes
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={requireLocation}
                onChange={(event) => setRequireLocation(event.target.checked)}
              />
              Require GPS Location Verification
            </label>
            <p style={styles.checkboxHint}>
              Students must be near your current location to check in successfully.
            </p>
          </div>

          {requireLocation && (
            <div style={styles.locationBox} aria-live="polite">
              {locating && <div style={styles.infoText}>Getting coordinates...</div>}
              {locationError && <div style={styles.errorText}>{locationError}</div>}
              {coords && (
                <div style={styles.successText}>
                  Coordinates acquired: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </div>
              )}
              {!coords && !locating && (
                <button type="button" style={styles.linkButton} onClick={acquireLocation}>
                  {locationError ? 'Try again' : 'Acquire Coordinates'}
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            style={{
              ...styles.button,
              ...styles.startButton,
              opacity: startDisabled ? 0.6 : 1,
            }}
            disabled={startDisabled}
            onClick={startSession}
          >
            {busy ? <Spinner /> : null}
            Start Check-in Session
          </button>
        </div>
      )}
    </Modal>
  );
}

const styles = {
  header: {
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '15px',
    paddingRight: '44px',
  },
  title: { margin: 0, fontSize: '20px', fontWeight: '600', color: '#fff' },
  activeContainer: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  activePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '8px 16px',
    borderRadius: '30px',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 10px #10b981',
    animation: 'statusPulse 2s ease-in-out infinite',
  },
  activeText: { fontSize: '14px', color: '#10b981', fontWeight: '600' },
  subtext: { fontSize: '14px', color: '#a3a3a3', lineHeight: '1.5', margin: 0 },
  codeWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '15px 30px',
  },
  codeLabel: {
    fontSize: '12px',
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '5px',
  },
  codeDisplay: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#06b6d4',
    letterSpacing: '4px',
    fontFamily: 'monospace',
  },
  timerWrapper: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' },
  timerLabel: { color: '#8c8c8c' },
  timerValue: { fontWeight: '700', color: '#ef4444', fontFamily: 'monospace', fontSize: '18px' },
  hint: { fontSize: '12px', color: '#8c8c8c', margin: 0 },
  setupContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '14px', fontWeight: '500', color: '#d4d4d4' },
  select: {
    backgroundColor: '#2e2e2e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
    outline: 'none',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
  },
  checkbox: { cursor: 'pointer', accentColor: '#e50914', width: '16px', height: '16px' },
  checkboxHint: {
    margin: 0,
    fontSize: '12px',
    color: '#8c8c8c',
    lineHeight: '1.4',
    paddingLeft: '26px',
  },
  locationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'flex-start',
  },
  infoText: { color: '#e0e0e0' },
  errorText: { color: '#ef4444', fontWeight: '500' },
  successText: { color: '#10b981', fontWeight: '500' },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '600',
    padding: 0,
    fontSize: '13px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 24px',
    borderRadius: '10px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    marginTop: '10px',
    fontFamily: "'Poppins', sans-serif",
  },
  startButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
  },
  stopButton: {
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    boxShadow: '0 4px 20px rgba(229, 9, 20, 0.3)',
  },
};
