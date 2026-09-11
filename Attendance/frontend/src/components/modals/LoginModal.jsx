import { useState } from 'react';
import { toast } from 'react-toastify';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import GoogleRoleForm from '../GoogleRoleForm';
import GoogleSignInButton from '../GoogleSignInButton';
import { ArrowRightIcon, LoadingDots, LockIcon, UserIcon, Spinner } from '../icons';
import Modal from '../Modal';
import PasswordInput from '../PasswordInput';
import { createModalFormStyles } from './modalFormStyles';

const styles = createModalFormStyles({ from: '#e50914', to: '#b00710' });

/** @param {{ onAuthenticated: (session: { token: string, user: object }) => void }} props */
export default function LoginModal({ open, onClose, onAuthenticated, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const google = useGoogleAuth({
    onAuthenticated: (session, isNewAccount) => {
      toast.success(isNewAccount ? 'Account created. Welcome!' : 'Login successful!');
      onAuthenticated(session);
    },
  });
  const busy = loading || google.loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const session = await authApi.login({ email, password });
      toast.success('Login successful!');
      setPassword('');
      onAuthenticated(session);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="login-title" maxWidth="440px">
      <div style={styles.logoContainer}>
        <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <defs>
            <linearGradient id="loginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#e50914', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ff4757', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#loginGradient)" opacity="0.2" />
          <path
            d="M30 10 L33 18 L42 20 L36 26 L38 35 L30 30 L22 35 L24 26 L18 20 L27 18 Z"
            fill="url(#loginGradient)"
          />
        </svg>
      </div>

      <h2 id="login-title" style={styles.title}>
        {google.needsRole ? (
          'Complete Signup'
        ) : loading ? (
          <LoadingDots>Logging in</LoadingDots>
        ) : (
          'Welcome Back'
        )}
      </h2>
      <p style={styles.subtitle}>
        {google.needsRole
          ? 'Please select your role and details to continue'
          : 'Enter your credentials to continue'}
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
              <label htmlFor="login-email" style={styles.label}>
                <UserIcon style={styles.labelIcon} />
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={styles.input}
                placeholder="Enter your email"
                disabled={busy}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="login-password" style={styles.label}>
                <LockIcon style={styles.labelIcon} />
                Password
              </label>
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
                placeholder="Enter your password"
                disabled={busy}
              />
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
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          <GoogleSignInButton text="signin_with" onCredential={google.handleCredential} />

          <p style={{ ...styles.footerText, marginTop: '16px' }}>
            Don&apos;t have an account?{' '}
            <button type="button" style={styles.linkButton} onClick={onSwitchToSignup}>
              Sign up
            </button>
          </p>
        </>
      )}
    </Modal>
  );
}
