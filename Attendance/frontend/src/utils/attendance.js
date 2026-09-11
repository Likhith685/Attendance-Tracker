/** Below this percentage a student is a defaulter. */
export const DEFAULTER_THRESHOLD = 75;
/** Below this percentage (but above the defaulter line) a student is at risk. */
export const AT_RISK_THRESHOLD = 85;

const TONES = {
  danger: {
    tone: 'danger',
    label: 'Shortage',
    color: '#ef4444',
    gradient: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
  },
  warning: {
    tone: 'warning',
    label: 'At Risk',
    color: '#f59e0b',
    gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
  },
  good: {
    tone: 'good',
    label: 'Good',
    color: '#10b981',
    gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
  },
};

export function attendancePercentage(attended, total) {
  return total > 0 ? (attended / total) * 100 : 0;
}

/** Colour and label for an attendance percentage. */
export function getAttendanceTone(percentage) {
  if (percentage < DEFAULTER_THRESHOLD) return TONES.danger;
  if (percentage < AT_RISK_THRESHOLD) return TONES.warning;
  return TONES.good;
}

/** Keeps progress bars within 0–100% even when counts are inconsistent. */
export function clampPercentage(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
