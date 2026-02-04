import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login({ trigger, setTrigger, onSuccess }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  if (!trigger) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/login', { email, password: pwd });
      if (res.status === 200) {
        localStorage.setItem('token', res.data.token);
        toast.success('Login successful!', { 
          position: 'top-right',
          theme: 'dark',
        });
        setTrigger(false);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed', { 
        position: 'top-right',
        theme: 'dark',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={() => setTrigger(false)}>
      <ToastContainer />
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          style={styles.closeBtn} 
          onClick={() => setTrigger(false)}
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Logo */}
        <div style={styles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            <defs>
              <linearGradient id="loginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#e50914", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#ff4757", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="30" cy="30" r="28" fill="url(#loginGradient)" opacity="0.2" />
            <path
              d="M30 10 L33 18 L42 20 L36 26 L38 35 L30 30 L22 35 L24 26 L18 20 L27 18 Z"
              fill="url(#loginGradient)"
            />
          </svg>
        </div>

        <h2 style={styles.title}>
          {loading ? (
            <>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              Logging in
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
            </>
          ) : (
            'Welcome Back'
          )}
        </h2>
        <p style={styles.subtitle}>Enter your credentials to continue</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M8 0a4 4 0 100 8 4 4 0 000-8zM2 14c0-3.31 2.69-6 6-6s6 2.69 6 6H2z"
                />
              </svg>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M8 0a3 3 0 00-3 3v2H3a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1h-2V3a3 3 0 00-3-3zm1 3v2H7V3a1 1 0 112 0z"
                />
              </svg>
              Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                style={styles.input}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                style={styles.eyeIcon}
                onClick={() => setShowPwd(!showPwd)}
                tabIndex="-1"
              >
                {showPwd ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3.26 11.602C3.942 8.327 6.793 6 10 6c3.206 0 6.057 2.327 6.74 5.602a.5.5 0 00.98-.204C16.943 7.673 13.711 5 10 5c-3.711 0-6.943 2.673-7.72 6.398a.5.5 0 00.98.204zM10 9a2 2 0 100 4 2 2 0 000-4z"
                      fill="currentColor"
                    />
                    <path
                      d="M2 2l16 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 6C6.793 6 3.942 8.327 3.26 11.602a.5.5 0 01-.98-.204C3.057 7.673 6.289 5 10 5c3.711 0 6.943 2.673 7.72 6.398a.5.5 0 01-.98.204C16.057 8.327 13.206 6 10 6z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 9a2 2 0 100 4 2 2 0 000-4z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(hoveredButton === 'submit' ? styles.submitBtnHover : {}),
              ...(loading ? styles.submitBtnLoading : {}),
            }}
            onMouseEnter={() => setHoveredButton('submit')}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <svg width="16" height="16" viewBox="0 0 16 16" style={styles.btnIcon}>
                  <path
                    fill="currentColor"
                    d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        <p style={styles.footerText}>
          Don't have an account? <span style={styles.link}>Sign up</span>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes loadingDots {
          0%, 20% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-out',
    fontFamily: "'Poppins', sans-serif",
  },

  modal: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '440px',
    padding: '40px 35px',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(229, 9, 20, 0.3)',
    position: 'relative',
    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.3s ease',
  },

  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '25px',
    filter: 'drop-shadow(0 0 20px rgba(229, 9, 20, 0.4))',
  },

  title: {
    textAlign: 'center',
    marginBottom: '10px',
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px',
  },

  loadingDot: {
    display: 'inline-block',
    animation: 'loadingDots 1.4s infinite',
  },

  subtitle: {
    textAlign: 'center',
    color: '#b3b3b3',
    fontSize: '14px',
    marginBottom: '35px',
    fontWeight: '400',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    color: '#e0e0e0',
    fontSize: '14px',
    letterSpacing: '0.3px',
  },

  labelIcon: {
    opacity: 0.7,
  },

  input: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },

  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  eyeIcon: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#8c8c8c',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.3s ease',
  },

  submitBtn: {
    marginTop: '10px',
    padding: '16px 32px',
    width: '100%',
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    letterSpacing: '0.5px',
    fontFamily: "'Poppins', sans-serif",
  },

  submitBtnHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 35px rgba(229, 9, 20, 0.6)',
  },

  submitBtnLoading: {
    opacity: 0.8,
    cursor: 'not-allowed',
  },

  btnIcon: {
    transition: 'transform 0.3s ease',
  },

  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '30px 0 20px',
  },

  dividerText: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    padding: '0 15px',
    color: '#8c8c8c',
    fontSize: '13px',
    position: 'relative',
    zIndex: 1,
  },

  footerText: {
    textAlign: 'center',
    color: '#b3b3b3',
    fontSize: '14px',
    margin: 0,
  },

  link: {
    color: '#e50914',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
};