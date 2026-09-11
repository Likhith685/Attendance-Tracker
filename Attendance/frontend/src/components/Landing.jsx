import React, { useState, useEffect } from "react";
import Signup from "./Signup";
import Login from "./Login";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Landing() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div style={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Animated Background Elements */}
      <div style={styles.bgOverlay}></div>
      <div style={styles.floatingCircle1}></div>
      <div style={styles.floatingCircle2}></div>
      <div style={styles.floatingCircle3}></div>

      <div style={{
        ...styles.card,
        ...(isLoaded ? styles.cardLoaded : {}),
      }}>
        {/* Logo/Icon */}
        <div style={styles.logoContainer}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={styles.logo}>
            <defs>
              <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#e50914", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#ff4757", stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle cx="40" cy="40" r="38" fill="url(#mainGradient)" opacity="0.2" />
            <path
              d="M40 15 L45 25 L56 27 L48 35 L50 46 L40 40 L30 46 L32 35 L24 27 L35 25 Z"
              fill="url(#mainGradient)"
              filter="url(#glow)"
            />
            <circle cx="40" cy="40" r="35" stroke="url(#mainGradient)" strokeWidth="2" fill="none" opacity="0.3" />
          </svg>
        </div>

        {/* Title Section */}
        <div style={styles.titleSection}>
          <h1 style={styles.title}>
            <span style={styles.titleWord}>Easy</span>
            <span style={styles.titleWord}>Attendance</span>
          </h1>
          <div style={styles.titleUnderline}></div>
        </div>

        <p style={styles.subtitle}>
          Simplify your attendance tracking in seconds!
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={styles.featureIcon}>
              <path
                fill="#10b981"
                d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.59 7.09l-5 5a1 1 0 01-1.42 0l-2.5-2.5a1 1 0 111.42-1.42L9 9.59l4.3-4.3a1 1 0 111.42 1.42z"
              />
            </svg>
            <span style={styles.featureText}>Quick & Easy</span>
          </div>
          <div style={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={styles.featureIcon}>
              <path
                fill="#10b981"
                d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.59 7.09l-5 5a1 1 0 01-1.42 0l-2.5-2.5a1 1 0 111.42-1.42L9 9.59l4.3-4.3a1 1 0 111.42 1.42z"
              />
            </svg>
            <span style={styles.featureText}>Secure & Reliable</span>
          </div>
          <div style={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={styles.featureIcon}>
              <path
                fill="#10b981"
                d="M10 0a10 10 0 100 20 10 10 0 000-20zm4.59 7.09l-5 5a1 1 0 01-1.42 0l-2.5-2.5a1 1 0 111.42-1.42L9 9.59l4.3-4.3a1 1 0 111.42 1.42z"
              />
            </svg>
            <span style={styles.featureText}>Real-time Updates</span>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              ...styles.signupButton,
              ...(hoveredButton === "signup" ? styles.signupButtonHover : {}),
            }}
            onClick={() => setShowSignup(true)}
            onMouseEnter={() => setHoveredButton("signup")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={styles.buttonIcon}>
              <path
                fill="currentColor"
                d="M9 0a9 9 0 100 18A9 9 0 009 0zm4 10h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V5a1 1 0 112 0v3h3a1 1 0 110 2z"
              />
            </svg>
            <span style={styles.buttonText}>Sign Up</span>
          </button>
          
          <button
            style={{
              ...styles.button,
              ...styles.loginButton,
              ...(hoveredButton === "login" ? styles.loginButtonHover : {}),
            }}
            onClick={() => setShowLogin(true)}
            onMouseEnter={() => setHoveredButton("login")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={styles.buttonIcon}>
              <path
                fill="currentColor"
                d="M9 0a9 9 0 100 18A9 9 0 009 0zm3.71 7.29l-2 2a1 1 0 01-1.42-1.42l.3-.29H6a1 1 0 010-2h3.59l-.3-.29a1 1 0 011.42-1.42l2 2a1 1 0 010 1.42zm-2 4.42l2-2a1 1 0 000-1.42l-2-2a1 1 0 00-1.42 1.42l.3.29H6a1 1 0 000 2h3.59l-.3.29a1 1 0 001.42 1.42z"
              />
            </svg>
            <span style={styles.buttonText}>Log In</span>
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Start managing your attendance effortlessly today
          </p>
        </div>
      </div>

      {/* Modals */}
      <Signup
        trigger={showSignup}
        setTrigger={setShowSignup}
        onSuccess={(role) => {
          setShowSignup(false);
          if (role) {
            if (role === 'Student') {
              window.location.href = "/student-dashboard";
            } else {
              window.location.href = "/home";
            }
          } else {
            setShowLogin(true);
          }
        }}
        onLoginLinkClick={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
      <Login
        trigger={showLogin}
        setTrigger={setShowLogin}
        onSuccess={(role) => {
          setShowLogin(false);
          if (role === 'Student') {
            window.location.href = "/student-dashboard";
          } else {
            window.location.href = "/home";
          }
        }}
        onSignupLinkClick={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap');
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(20px) rotate(-5deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(229, 9, 20, 0.6);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Custom toast styles */
        .Toastify__toast--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        }

        .Toastify__toast--error {
          background: linear-gradient(135deg, #e50914 0%, #b00710 100%) !important;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    fontFamily: "'Poppins', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },

  bgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(229, 9, 20, 0.1) 0%, transparent 50%)",
    pointerEvents: "none",
  },

  floatingCircle1: {
    position: "absolute",
    top: "10%",
    left: "10%",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(229, 9, 20, 0.15) 0%, transparent 70%)",
    animation: "float 8s ease-in-out infinite",
    pointerEvents: "none",
  },

  floatingCircle2: {
    position: "absolute",
    bottom: "10%",
    right: "10%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 71, 87, 0.1) 0%, transparent 70%)",
    animation: "floatReverse 10s ease-in-out infinite",
    pointerEvents: "none",
  },

  floatingCircle3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(229, 9, 20, 0.05) 0%, transparent 70%)",
    animation: "pulse 6s ease-in-out infinite",
    pointerEvents: "none",
  },

  card: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    padding: "60px 50px",
    borderRadius: "24px",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    textAlign: "center",
    minWidth: "450px",
    maxWidth: "600px",
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    opacity: 0,
    transform: "scale(0.9) translateY(20px)",
    transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  cardLoaded: {
    opacity: 1,
    transform: "scale(1) translateY(0)",
  },

  logoContainer: {
    marginBottom: "30px",
    animation: "pulse 3s ease-in-out infinite",
  },

  logo: {
    filter: "drop-shadow(0 0 30px rgba(229, 9, 20, 0.5))",
  },

  titleSection: {
    marginBottom: "20px",
  },

  title: {
    margin: "0 0 16px 0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  titleWord: {
    fontSize: "48px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-1px",
    lineHeight: "1.1",
    filter: "drop-shadow(0 0 30px rgba(229, 9, 20, 0.3))",
  },

  titleUnderline: {
    width: "120px",
    height: "4px",
    background: "linear-gradient(90deg, transparent, #e50914, transparent)",
    margin: "0 auto",
    borderRadius: "2px",
  },

  subtitle: {
    margin: "0 0 40px 0",
    color: "#b3b3b3",
    fontSize: "16px",
    fontWeight: "400",
    letterSpacing: "0.5px",
    lineHeight: "1.6",
  },

  features: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "40px",
    padding: "30px 20px",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "center",
  },

  featureIcon: {
    flexShrink: 0,
  },

  featureText: {
    color: "#e0e0e0",
    fontSize: "15px",
    fontWeight: "500",
    letterSpacing: "0.3px",
  },

  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },

  button: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 36px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "'Poppins', sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  buttonIcon: {
    transition: "transform 0.3s ease",
  },

  buttonText: {
    position: "relative",
    zIndex: 1,
  },

  signupButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
  },

  signupButtonHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 35px rgba(16, 185, 129, 0.5)",
    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  },

  loginButton: {
    background: "linear-gradient(135deg, #e50914 0%, #b00710 100%)",
    color: "#ffffff",
    boxShadow: "0 8px 25px rgba(229, 9, 20, 0.3)",
  },

  loginButtonHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 35px rgba(229, 9, 20, 0.5)",
    background: "linear-gradient(135deg, #b00710 0%, #8b0000 100%)",
  },

  footer: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },

  footerText: {
    color: "#8c8c8c",
    fontSize: "13px",
    fontWeight: "400",
    margin: 0,
    letterSpacing: "0.3px",
  },
};