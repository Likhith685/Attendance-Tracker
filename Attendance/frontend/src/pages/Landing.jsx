import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoginModal from '../components/modals/LoginModal';
import SignupModal from '../components/modals/SignupModal';
import { useAuth } from '../context/useAuth';
import { homePathFor } from '../utils/routes';

const FEATURES = ['Quick & Easy', 'Secure & Reliable', 'Real-time Updates'];

export default function Landing() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null); // 'login' | 'signup' | null
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsLoaded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Signed-in users (including right after logging in) go straight to their dashboard.
  if (user) {
    const requested = location.state?.from?.pathname;
    return <Navigate to={requested ?? homePathFor(user.role)} replace />;
  }

  const closeModal = () => setActiveModal(null);

  return (
    <main style={styles.container}>
      <div style={styles.bgOverlay} aria-hidden="true" />
      <div style={styles.floatingCircle1} aria-hidden="true" />
      <div style={styles.floatingCircle2} aria-hidden="true" />
      <div style={styles.floatingCircle3} aria-hidden="true" />

      <div
        className="landing-card"
        style={{ ...styles.card, ...(isLoaded ? styles.cardLoaded : {}) }}
      >
        <div style={styles.logoContainer}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={styles.logo} aria-hidden="true">
            <defs>
              <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#e50914', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ff4757', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="40" cy="40" r="38" fill="url(#mainGradient)" opacity="0.2" />
            <path
              d="M40 15 L45 25 L56 27 L48 35 L50 46 L40 40 L30 46 L32 35 L24 27 L35 25 Z"
              fill="url(#mainGradient)"
              filter="url(#glow)"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="url(#mainGradient)"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>

        <div style={styles.titleSection}>
          <h1 style={styles.title}>
            <span className="landing-title-word" style={styles.titleWord}>
              Easy
            </span>
            <span className="landing-title-word" style={styles.titleWord}>
              Attendance
            </span>
          </h1>
          <div style={styles.titleUnderline} aria-hidden="true" />
        </div>

        <p style={styles.subtitle}>Simplify your attendance tracking in seconds!</p>

        <ul style={styles.features}>
          {FEATURES.map((feature) => (
            <li key={feature} style={styles.feature}>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fill="#10b981"
                  d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.59 7.09l-5 5a1 1 0 01-1.42 0l-2.5-2.5a1 1 0 111.42-1.42L9 9.59l4.3-4.3a1 1 0 111.42 1.42z"
                />
              </svg>
              <span style={styles.featureText}>{feature}</span>
            </li>
          ))}
        </ul>

        <div style={styles.buttonGroup}>
          <button
            type="button"
            style={{
              ...styles.button,
              ...styles.signupButton,
              ...(hoveredButton === 'signup' ? styles.signupButtonHover : {}),
            }}
            onClick={() => setActiveModal('signup')}
            onMouseEnter={() => setHoveredButton('signup')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 0a9 9 0 100 18A9 9 0 009 0zm4 10h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V5a1 1 0 112 0v3h3a1 1 0 110 2z"
              />
            </svg>
            <span>Sign Up</span>
          </button>

          <button
            type="button"
            style={{
              ...styles.button,
              ...styles.loginButton,
              ...(hoveredButton === 'login' ? styles.loginButtonHover : {}),
            }}
            onClick={() => setActiveModal('login')}
            onMouseEnter={() => setHoveredButton('login')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 0a9 9 0 100 18A9 9 0 009 0zm3.71 7.29l-2 2a1 1 0 01-1.42-1.42l.3-.29H6a1 1 0 010-2h3.59l-.3-.29a1 1 0 011.42-1.42l2 2a1 1 0 010 1.42z"
              />
            </svg>
            <span>Log In</span>
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>Start managing your attendance effortlessly today</p>
        </div>
      </div>

      <SignupModal
        open={activeModal === 'signup'}
        onClose={closeModal}
        onAuthenticated={login}
        onSwitchToLogin={() => setActiveModal('login')}
      />
      <LoginModal
        open={activeModal === 'login'}
        onClose={closeModal}
        onAuthenticated={login}
        onSwitchToSignup={() => setActiveModal('signup')}
      />
    </main>
  );
}

const circle = {
  position: 'absolute',
  borderRadius: '50%',
  pointerEvents: 'none',
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    fontFamily: "'Poppins', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(229, 9, 20, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  floatingCircle1: {
    ...circle,
    top: '10%',
    left: '10%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(229, 9, 20, 0.15) 0%, transparent 70%)',
    animation: 'float 8s ease-in-out infinite',
  },
  floatingCircle2: {
    ...circle,
    bottom: '10%',
    right: '10%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(255, 71, 87, 0.1) 0%, transparent 70%)',
    animation: 'floatReverse 10s ease-in-out infinite',
  },
  floatingCircle3: {
    ...circle,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(229, 9, 20, 0.05) 0%, transparent 70%)',
    animation: 'pulseCentered 6s ease-in-out infinite',
  },
  card: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    padding: '60px 50px',
    borderRadius: '24px',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
    position: 'relative',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    opacity: 0,
    transform: 'scale(0.9) translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardLoaded: { opacity: 1, transform: 'scale(1) translateY(0)' },
  logoContainer: { marginBottom: '30px', animation: 'pulse 3s ease-in-out infinite' },
  logo: { filter: 'drop-shadow(0 0 30px rgba(229, 9, 20, 0.5))' },
  titleSection: { marginBottom: '20px' },
  title: { margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' },
  titleWord: {
    fontSize: '48px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-1px',
    lineHeight: '1.1',
    filter: 'drop-shadow(0 0 30px rgba(229, 9, 20, 0.3))',
  },
  titleUnderline: {
    width: '120px',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #e50914, transparent)',
    margin: '0 auto',
    borderRadius: '2px',
  },
  subtitle: {
    margin: '0 0 40px 0',
    color: '#b3b3b3',
    fontSize: '16px',
    letterSpacing: '0.5px',
    lineHeight: '1.6',
  },
  features: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    margin: '0 0 40px 0',
    padding: '30px 20px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  feature: { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' },
  featureText: { color: '#e0e0e0', fontSize: '15px', fontWeight: '500', letterSpacing: '0.3px' },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 36px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
    letterSpacing: '0.5px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Poppins', sans-serif",
    color: '#ffffff',
  },
  signupButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
  },
  signupButtonHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 35px rgba(16, 185, 129, 0.5)',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  },
  loginButton: {
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.3)',
  },
  loginButtonHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 35px rgba(229, 9, 20, 0.5)',
    background: 'linear-gradient(135deg, #b00710 0%, #8b0000 100%)',
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerText: { color: '#8c8c8c', fontSize: '13px', margin: 0, letterSpacing: '0.3px' },
};
