import React, { useState, useEffect } from "react";
import AddCroom from "./AddCroom";
import axios from "axios";

export default function Navbar() {
  const [addRoom, setAddRoom] = useState(false);
  const [user, setUser] = useState({});
  const [hoveredButton, setHoveredButton] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/user", {
          headers: { token: localStorage.getItem("token") },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AddCroom trigger={addRoom} setTrigger={setAddRoom} datax={user.userid} />

      <nav style={{
        ...styles.navbar,
        ...(scrolled ? styles.navbarScrolled : {}),
      }}>
        <div style={styles.container}>
          <div style={styles.left}>
            <div style={styles.logoWrapper}>
              <svg width="40" height="40" viewBox="0 0 40 40" style={styles.logo}>
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#e50914", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#ff4757", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <rect width="40" height="40" rx="8" fill="url(#logoGradient)" />
                <path
                  d="M12 10h4v20h-4V10zm12 0h4v20h-4V10zm-8 6h4v14h-4V16z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
              <div style={styles.brandInfo}>
                <span style={styles.brandName}>Attendance</span>
                <span style={styles.brandTagline}>Tracker</span>
              </div>
            </div>
            
            <div style={styles.welcomeSection}>
              <p style={styles.welcome}>
                Welcome back,{" "}
                <span style={styles.username}>{user?.name || "User"}</span>
              </p>
              <div style={styles.statusIndicator}>
                <div style={styles.statusDot}></div>
                <span style={styles.statusText}>Online</span>
              </div>
            </div>
          </div>

          <div style={styles.right}>
            <button
              style={{
                ...styles.button,
                ...styles.addButton,
                ...(hoveredButton === "add" ? styles.addButtonHover : {}),
              }}
              onClick={() => setAddRoom(true)}
              onMouseEnter={() => setHoveredButton("add")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={styles.buttonIcon}>
                <path
                  fill="currentColor"
                  d="M9 0a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H1a1 1 0 110-2h7V1a1 1 0 011-1z"
                />
              </svg>
              <span style={styles.buttonText}>Add Classroom</span>
            </button>

            <button
              style={{
                ...styles.button,
                ...styles.logoutButton,
                ...(hoveredButton === "logout" ? styles.logoutButtonHover : {}),
              }}
              onClick={handleLogout}
              onMouseEnter={() => setHoveredButton("logout")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={styles.buttonIcon}>
                <path
                  fill="currentColor"
                  d="M7 2a1 1 0 00-1 1v12a1 1 0 001 1h4a1 1 0 100-2H8V4h3a1 1 0 100-2H7zm6.707 4.293a1 1 0 00-1.414 1.414L13.586 9H7a1 1 0 100 2h6.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3z"
                />
              </svg>
              <span style={styles.buttonText}>Logout</span>
            </button>
          </div>
        </div>

        <div style={styles.navGlow}></div>
      </nav>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "linear-gradient(135deg, #141414 0%, #1f1f1f 100%)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(229, 9, 20, 0.2)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: "slideDown 0.6s ease-out",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
  },

  navbarScrolled: {
    boxShadow: "0 8px 40px rgba(229, 9, 20, 0.3)",
    borderBottom: "1px solid rgba(229, 9, 20, 0.4)",
  },

  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    maxWidth: "1600px",
    margin: "0 auto",
    flexWrap: "wrap",
    gap: "20px",
    position: "relative",
    zIndex: 2,
  },

  navGlow: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "60%",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #e50914, transparent)",
    animation: "glow 2s ease-in-out infinite",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "40px",
    flex: "1",
    minWidth: "300px",
  },

  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    filter: "drop-shadow(0 0 20px rgba(229, 9, 20, 0.4))",
  },

  brandInfo: {
    display: "flex",
    flexDirection: "column",
    lineHeight: "1.2",
  },

  brandName: {
    fontSize: "24px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },

  brandTagline: {
    fontSize: "12px",
    color: "#8c8c8c",
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontWeight: "600",
  },

  welcomeSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  welcome: {
    margin: 0,
    fontSize: "16px",
    color: "#b3b3b3",
    fontWeight: "400",
    letterSpacing: "0.3px",
  },

  username: {
    fontWeight: "700",
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontSize: "18px",
  },

  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
    animation: "pulse 2s ease-in-out infinite",
  },

  statusText: {
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  right: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  button: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px",
    letterSpacing: "0.3px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
  },

  buttonIcon: {
    transition: "transform 0.3s ease",
  },

  buttonText: {
    position: "relative",
    zIndex: 1,
  },

  addButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
  },

  addButtonHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(16, 185, 129, 0.5)",
    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  },

  logoutButton: {
    background: "linear-gradient(135deg, #e50914 0%, #b00710 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 20px rgba(229, 9, 20, 0.3)",
  },

  logoutButtonHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(229, 9, 20, 0.5)",
    background: "linear-gradient(135deg, #b00710 0%, #8b0000 100%)",
  },
};