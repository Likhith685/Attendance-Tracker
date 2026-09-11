import { useState } from 'react';
import { toast } from 'react-toastify';
import { isValidRoll } from '../utils/validation';
import { ArrowRightIcon, IdCardIcon, RoleIcon, Spinner } from './icons';

/**
 * Collects the role (and roll number for students) for a first-time Google user.
 * `styles` comes from the hosting modal so the form matches its look.
 */
export default function GoogleRoleForm({ styles, loading, onSubmit, onCancel }) {
  const [role, setRole] = useState('Teacher');
  const [roll, setRoll] = useState('');
  const [hovered, setHovered] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (role === 'Student' && !isValidRoll(roll)) {
      toast.error('Please enter a valid roll number.');
      return;
    }
    onSubmit({ role, roll: role === 'Student' ? Number(roll) : undefined });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
        <label htmlFor="google-role" style={styles.label}>
          <RoleIcon style={styles.labelIcon} />
          Select Role
        </label>
        <select
          id="google-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          style={styles.select}
          disabled={loading}
        >
          <option value="Teacher" style={styles.selectOption}>
            Teacher
          </option>
          <option value="Student" style={styles.selectOption}>
            Student
          </option>
        </select>
      </div>

      {role === 'Student' && (
        <div style={styles.inputGroup}>
          <label htmlFor="google-roll" style={styles.label}>
            <IdCardIcon style={styles.labelIcon} />
            Roll Number
          </label>
          <input
            id="google-roll"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={roll}
            onChange={(event) => setRoll(event.target.value)}
            style={styles.input}
            placeholder="Enter your roll number"
            disabled={loading}
          />
        </div>
      )}

      <button
        type="submit"
        style={{
          ...styles.submitBtn,
          ...(hovered ? styles.submitBtnHover : {}),
          ...(loading ? styles.submitBtnLoading : {}),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner />
            <span>Registering...</span>
          </>
        ) : (
          <>
            <span>Complete Registration</span>
            <ArrowRightIcon />
          </>
        )}
      </button>

      <button
        type="button"
        style={{
          ...styles.submitBtn,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
          marginTop: '5px',
        }}
        onClick={onCancel}
        disabled={loading}
      >
        Cancel
      </button>
    </form>
  );
}
