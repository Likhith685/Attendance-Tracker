import { useState } from 'react';
import { toast } from 'react-toastify';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { isValidRoll } from '../../utils/validation';
import GoogleRoleForm from '../GoogleRoleForm';
import GoogleSignInButton from '../GoogleSignInButton';
import {
  ArrowRightIcon,
  IdCardIcon,
  LoadingDots,
  LockIcon,
  MailIcon,
  RoleIcon,
  Spinner,
  UserIcon,
} from '../icons';
import Modal from '../Modal';
import PasswordInput from '../PasswordInput';
import { createModalFormStyles } from './modalFormStyles';

const styles = createModalFormStyles({ from: '#10b981', to: '#059669', compact: true });
const MIN_PASSWORD_LENGTH = 8;

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'Teacher',
  roll: '',
};

function validate(form) {
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (form.password !== form.confirmPassword) return 'Passwords do not match.';
  if (form.role === 'Student' && !isValidRoll(form.roll)) {
    return 'A valid roll number is required for students.';
  }
  return null;
}

/** @param {{ onAuthenticated: (session: { token: string, user: object }) => void }} props */
export default function SignupModal({ open, onClose, onAuthenticated, onSwitchToLogin }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const google = useGoogleAuth({
    onAuthenticated: (session, isNewAccount) => {
      toast.success(isNewAccount ? 'Account created. Welcome!' : 'Login successful!');
      onAuthenticated(session);
    },
  });
  const busy = loading || google.loading;

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      toast.error(problem);
      return;
    }

    setLoading(true);
    try {
      const session = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        roll: form.role === 'Student' ? Number(form.roll) : undefined,
      });
      toast.success('Signed up and logged in successfully!');
      setForm(EMPTY_FORM);
      onAuthenticated(session);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Sign up failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="signup-title"
      accent="rgba(16, 185, 129, 0.3)"
      maxWidth="440px"
      padding="24px 30px"
    >
      <div style={styles.logoContainer}>
        <svg width="40" height="40" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <linearGradient id="signupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#signupGradient)" opacity="0.2" />
          <path
            d="M30 15 L35 25 L45 27 L37.5 34.5 L39.5 45 L30 39.5 L20.5 45 L22.5 34.5 L15 27 L25 25 Z"
            fill="url(#signupGradient)"
          />
        </svg>
      </div>

      <h2 id="signup-title" style={styles.title}>
        {google.needsRole ? (
          'Complete Signup'
        ) : loading ? (
          <LoadingDots>Creating Account</LoadingDots>
        ) : (
          'Create Account'
        )}
      </h2>
      <p style={styles.subtitle}>
        {google.needsRole
          ? 'Please select your role and details to continue'
          : 'Join us and start managing attendance'}
      </p>

      {google.needsRole ? (
        <GoogleRoleForm
          styles={styles}
          loading={google.loading}
          onSubmit={google.completeRegistration}
          onCancel={google.cancel}
        />
      ) : (
        <>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="signup-name" style={styles.label}>
                <UserIcon style={styles.labelIcon} />
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                autoFocus
                required
                maxLength={100}
                value={form.name}
                onChange={update('name')}
                style={styles.input}
                placeholder="Enter your name"
                disabled={busy}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label htmlFor="signup-role" style={styles.label}>
                  <RoleIcon style={styles.labelIcon} />
                  Select Role
                </label>
                <select
                  id="signup-role"
                  value={form.role}
                  onChange={update('role')}
                  style={styles.select}
                  disabled={busy}
                >
                  <option value="Teacher" style={styles.selectOption}>
                    Teacher
                  </option>
                  <option value="Student" style={styles.selectOption}>
                    Student
                  </option>
                </select>
              </div>

              {form.role === 'Student' && (
                <div style={styles.inputGroup}>
                  <label htmlFor="signup-roll" style={styles.label}>
                    <IdCardIcon style={styles.labelIcon} />
                    Roll Number
                  </label>
                  <input
                    id="signup-roll"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    required
                    value={form.roll}
                    onChange={update('roll')}
                    style={styles.input}
                    placeholder="Roll Number"
                    disabled={busy}
                  />
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="signup-email" style={styles.label}>
                <MailIcon style={styles.labelIcon} />
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={update('email')}
                style={styles.input}
                placeholder="Enter your email"
                disabled={busy}
                aria-describedby="signup-email-hint"
              />
              <p id="signup-email-hint" style={styles.hint}>
                ⚠️ Use an address you check regularly to receive automated absence warnings.
              </p>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label htmlFor="signup-password" style={styles.label}>
                  <LockIcon style={styles.labelIcon} />
                  Password
                </label>
                <PasswordInput
                  id="signup-password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={form.password}
                  onChange={update('password')}
                  style={styles.input}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} chars`}
                  disabled={busy}
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="signup-confirm" style={styles.label}>
                  <LockIcon style={styles.labelIcon} />
                  Confirm Password
                </label>
                <PasswordInput
                  id="signup-confirm"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  style={styles.input}
                  placeholder="Confirm password"
                  disabled={busy}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                ...(hovered ? styles.submitBtnHover : {}),
                ...(busy ? styles.submitBtnLoading : {}),
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              disabled={busy}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          <GoogleSignInButton text="signup_with" onCredential={google.handleCredential} />

          <p style={{ ...styles.footerText, marginTop: '12px' }}>
            Already have an account?{' '}
            <button type="button" style={styles.linkButton} onClick={onSwitchToLogin}>
              Login
            </button>
          </p>
        </>
      )}
    </Modal>
  );
}
