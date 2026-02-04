import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function AddStudent({ trigger, setTrigger, roomid, reload, setreload }) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [att, setAtt] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:5000/createstudent", {
        name,
        roll,
        roomid,
        attendance: att,
      });

      toast.success("Student added successfully!", { 
        position: "top-right",
        theme: "dark",
      });
      setTrigger(false);
      setreload(!reload);
      
      // Reset form
      setName("");
      setRoll("");
      setAtt("");
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      toast.error(message, { 
        position: "top-right",
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!trigger) return null;

  return (
    <div style={styles.overlay} onClick={() => setTrigger(false)}>
      <ToastContainer />
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
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

        {/* Icon */}
        <div style={styles.iconContainer}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <defs>
              <linearGradient id="addStudentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#2563eb", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="35" cy="35" r="33" fill="url(#addStudentGradient)" opacity="0.2" />
            <circle cx="35" cy="25" r="8" fill="url(#addStudentGradient)" />
            <path
              d="M22 50c0-7.18 5.82-13 13-13s13 5.82 13 13"
              stroke="url(#addStudentGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M45 30l5 5M50 30l-5 5"
              stroke="url(#addStudentGradient)"
              strokeWidth="3"
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
              Adding Student
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
              <span style={styles.loadingDot}>.</span>
            </>
          ) : (
            'Add Student'
          )}
        </h2>
        <p style={styles.subtitle}>Add a new student to this classroom</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M8 0a4 4 0 100 8 4 4 0 000-8zM2 14c0-3.31 2.69-6 6-6s6 2.69 6 6H2z"
                />
              </svg>
              Student Name
            </label>
            <input
              type="text"
              placeholder="Enter student's full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm3 1a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
                />
              </svg>
              Roll Number
            </label>
            <input
              type="number"
              placeholder="Enter roll number"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={styles.labelIcon}>
                <path
                  fill="currentColor"
                  d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"
                />
              </svg>
              Current Attendance
            </label>
            <input
              type="number"
              placeholder="Enter current attendance count"
              value={att}
              onChange={(e) => setAtt(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
              min="0"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(hoveredButton === 'submit' ? styles.submitBtnHover : {}),
              ...(loading ? styles.submitBtnLoading : {}),
            }}
            onMouseEnter={() => setHoveredButton('submit')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                <span>Adding Student...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                  <path
                    fill="currentColor"
                    d="M9 0a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H1a1 1 0 110-2h7V1a1 1 0 011-1z"
                  />
                </svg>
                <span>Add Student</span>
              </>
            )}
          </button>
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
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

  card: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "40px 35px",
    width: "90%",
    maxWidth: "450px",
    position: "relative",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.3)",
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
    filter: "drop-shadow(0 0 25px rgba(59, 130, 246, 0.4))",
  },

  title: {
    marginBottom: "10px",
    fontSize: "32px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
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

  inputGroup: {
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

  submitBtn: {
    marginTop: "10px",
    padding: "16px 32px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "16px",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    fontFamily: "'Poppins', sans-serif",
  },

  submitBtnHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 35px rgba(59, 130, 246, 0.6)",
  },

  submitBtnLoading: {
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