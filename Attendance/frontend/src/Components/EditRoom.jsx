import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function EditRoom(props) {
  const [cname, setCname] = useState(props.cname);
  const [ccode, setCcode] = useState(props.ccode);
  const [days, setDays] = useState(props.days);
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put("http://localhost:5000/editroom", {
        roomid: props.idx,
        cname,
        ccode,
        days,
      });
      
      toast.success("Classroom updated successfully!", {
        position: "top-right",
        theme: "dark",
      });
      
      props.setTrigger(0);
      props.setreload((prev) => (prev ? 0 : 1));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, {
        position: "top-right",
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!props.trigger) return null;

  return (
    <div style={styles.modalBackground} onClick={() => props.setTrigger(0)}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          style={styles.closeBtn} 
          onClick={() => props.setTrigger(0)}
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

        {/* Icon */}
        <div style={styles.iconContainer}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <defs>
              <linearGradient id="editRoomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#f59e0b", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#d97706", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="35" cy="35" r="33" fill="url(#editRoomGradient)" opacity="0.2" />
            <path
              d="M15 50h40M20 50V30l15-15 15 15v20"
              stroke="url(#editRoomGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M48 22L52 18l4 4-4 4-4-4z"
              fill="url(#editRoomGradient)"
            />
            <path
              d="M40 30l8-8"
              stroke="url(#editRoomGradient)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 style={styles.title}>
          {loading ? (
            <>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              Updating
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
            </>
          ) : (
            'Edit Classroom'
          )}
        </h2>
        <p style={styles.subtitle}>Update classroom information</p>

        <form onSubmit={handleEdit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2 0v12h8V2H4z"
                />
              </svg>
              Course Name
            </label>
            <input
              type="text"
              required
              style={styles.input}
              value={cname}
              onChange={(e) => setCname(e.target.value)}
              placeholder="Enter course name"
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M8 0a3 3 0 00-3 3v1H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1h-2V3a3 3 0 00-3-3zM7 3a1 1 0 112 0v1H7V3zm3 5a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
              Course Code
            </label>
            <input
              type="text"
              required
              style={styles.input}
              value={ccode}
              onChange={(e) => setCcode(e.target.value)}
              placeholder="Enter course code"
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M11 0H5a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V2a2 2 0 00-2-2zM5 1h6a1 1 0 011 1v10H4V2a1 1 0 011-1zm6 14H5a1 1 0 01-1-1v-1h8v1a1 1 0 01-1 1z"
                />
              </svg>
              Total Days
            </label>
            <input
              type="number"
              required
              style={styles.input}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Enter total days"
              disabled={loading}
              min="0"
            />
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...(hoveredButton === 'submit' ? styles.btnPrimaryHover : {}),
                ...(loading ? styles.btnLoading : {}),
              }}
              onMouseEnter={() => setHoveredButton('submit')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                    <path
                      fill="currentColor"
                      d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"
                    />
                  </svg>
                  <span>Update Classroom</span>
                </>
              )}
            </button>
          </div>
        </form>
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
  modalBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease-out",
    fontFamily: "'Poppins', sans-serif",
    overflowY: "auto",
    padding: "20px",
  },

  modalCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "40px 35px",
    width: "90%",
    maxWidth: "450px",
    position: "relative",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 158, 11, 0.3)",
    textAlign: "center",
    animation: "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    margin: "auto",
  },

  closeBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    transition: "all 0.3s ease",
  },

  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "25px",
    filter: "drop-shadow(0 0 25px rgba(245, 158, 11, 0.4))",
  },

  title: {
    fontSize: "32px",
    marginBottom: "10px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },

  loadingDot: {
    display: "inline-block",
    animation: "loadingDots 1.4s infinite",
  },

  subtitle: {
    color: "#b3b3b3",
    fontSize: "14px",
    marginBottom: "35px",
    fontWeight: "400",
    letterSpacing: "0.3px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    textAlign: "left",
  },

  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500",
    color: "#e0e0e0",
    fontSize: "14px",
    letterSpacing: "0.3px",
  },

  labelIcon: {
    opacity: 0.7,
  },

  input: {
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif",
  },

  actions: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
  },

  btn: {
    padding: "16px 32px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    fontFamily: "'Poppins', sans-serif",
  },

  btnPrimary: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    boxShadow: "0 8px 25px rgba(245, 158, 11, 0.4)",
  },

  btnPrimaryHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 35px rgba(245, 158, 11, 0.6)",
  },

  btnLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },

  btnIcon: {
    transition: "transform 0.3s ease",
  },

  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};