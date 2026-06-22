import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedLogs, setExpandedLogs] = useState({}); // roomid -> boolean

  const roll = localStorage.getItem("roll");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !roll) {
      navigate("/");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/student/dashboard/${roll}`, {
          headers: { token }
        });
        setClassrooms(res.data.classrooms || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load student dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [roll, token, navigate]);

  const toggleLog = (roomId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loaderContainer}>
          <div style={styles.loader}>
            <div style={styles.loaderRing}></div>
            <div style={styles.loaderRing}></div>
            <div style={styles.loaderRing}></div>
          </div>
          <p style={styles.loaderText}>Loading your student portal...</p>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalClasses = classrooms.length;
  let overallPercentage = 0;
  if (totalClasses > 0) {
    const totalDays = classrooms.reduce((sum, c) => sum + c.days, 0);
    const totalAttended = classrooms.reduce((sum, c) => sum + c.studentAttendance, 0);
    overallPercentage = totalDays > 0 ? (totalAttended / totalDays * 100) : 0;
  }

  return (
    <div className="student-dashboard-page-wrapper" style={styles.pageWrapper}>
      <div className="student-dashboard-container" style={styles.container}>
        {/* Header summary */}
        <div className="student-dashboard-header-card" style={styles.headerCard}>
          <div style={styles.headerInfo}>
            <div style={styles.avatar}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <h2 style={styles.studentTitle}>Student Attendance Portal</h2>
              <p style={styles.studentSubtitle}>
                Roll Number: <strong style={{ color: "#3b82f6" }}>{roll}</strong>
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.btnLogout}>
            Logout
          </button>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        {totalClasses === 0 ? (
          <div style={styles.emptyStateCard}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#ef4444", marginBottom: "20px" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 style={styles.emptyTitle}>No Classrooms Found</h3>
            <p style={styles.emptyText}>
              You are not registered in any classrooms yet. Please ask your teacher to add your roll number (<strong style={{ color: "#fff" }}>{roll}</strong>) to their class roster.
            </p>
          </div>
        ) : (
          <div>
            {/* Quick Stats Grid */}
            <div className="student-dashboard-stats-grid" style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Enrolled Courses</span>
                  <span style={styles.statValue}>{totalClasses}</span>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={overallPercentage >= 75 ? "#10b981" : "#ef4444"} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Overall Attendance</span>
                  <span style={{ ...styles.statValue, color: overallPercentage >= 75 ? "#10b981" : "#ef4444" }}>
                    {overallPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Courses List */}
            <h3 style={styles.sectionTitle}>Your Courses</h3>
            <div className="student-dashboard-courses-grid" style={styles.coursesGrid}>
              {classrooms.map((room) => {
                const pct = room.attendancePercentage;
                let textColor = '#10b981';
                let barBackground = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
                let badgeStyle = styles.badgeGreen;
                let statusLabel = "Good";

                if (pct < 75) {
                  textColor = '#ef4444';
                  barBackground = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                  badgeStyle = styles.badgeRed;
                  statusLabel = "Shortage";
                } else if (pct < 85) {
                  textColor = '#f59e0b';
                  barBackground = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
                  badgeStyle = styles.badgeYellow;
                  statusLabel = "At Risk";
                }

                const isExpanded = !!expandedLogs[room.roomid];

                return (
                  <div key={room.roomid} style={styles.courseCard}>
                    <div style={styles.cardHeader}>
                      <div>
                        <span style={styles.courseCode}>{room.ccode}</span>
                        <h4 style={styles.courseName}>{room.cname}</h4>
                      </div>
                      <span style={badgeStyle}>{statusLabel}</span>
                    </div>
                    <div style={styles.attendanceSummary}>
                      <span style={{ color: "#aaa" }}>Attendance Rate:</span>
                      <strong style={{ color: textColor, fontSize: "18px" }}>
                        {room.studentAttendance} / {room.days} ({pct.toFixed(0)}%)
                      </strong>
                    </div>

                    {/* Progress bar */}
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          background: barBackground,
                          width: `${pct}%`,
                        }}
                      ></div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                      {room.checkInActive && (
                        <button
                          onClick={() => navigate(`/student-checkin/${room.roomid}`)}
                          style={styles.btnCardCheckIn}
                        >
                          <span style={styles.pulseDot}></span>
                          <span>Check-in Active</span>
                        </button>
                      )}
                      <button
                        onClick={() => toggleLog(room.roomid)}
                        style={{
                          ...styles.btnAccordion,
                          flex: 1,
                          color: isExpanded ? "#3b82f6" : "#b3b3b3",
                          background: isExpanded ? "rgba(59, 130, 246, 0.08)" : "rgba(255,255,255,0.03)",
                          margin: 0
                        }}
                      >
                        <span>{isExpanded ? "Hide Logs" : "View Logs"}</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.3s ease"
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {/* History logs slide out */}
                    {isExpanded && (
                      <div style={styles.logsWrapper}>
                        {room.logs.length === 0 ? (
                          <p style={styles.noLogs}>No attendance sessions recorded yet.</p>
                        ) : (
                          <div style={styles.logsList}>
                            {room.logs.map((log, idx) => (
                              <div key={idx} style={styles.logItem}>
                                <span style={styles.logDate}>{log.date}</span>
                                <span
                                  style={{
                                    ...styles.logStatus,
                                    color: log.status === "Present" ? "#10b981" : "#ef4444",
                                    background: log.status === "Present" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                    border: log.status === "Present" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                                  }}
                                >
                                  {log.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    width: "100%",
  },
  container: {
    maxWidth: "1100px",
    width: "100%",
    padding: "40px 20px",
    margin: "0 auto",
    background: "transparent",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  loader: {
    position: "relative",
    width: "80px",
    height: "80px",
  },
  loaderRing: {
    position: "absolute",
    width: "80px",
    height: "80px",
    border: "4px solid transparent",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1.5s linear infinite",
  },
  loaderText: {
    marginTop: "30px",
    color: "#b3b3b3",
    fontSize: "18px",
    fontWeight: "500",
  },
  headerCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "25px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    marginBottom: "35px",
    flexWrap: "wrap",
    gap: "20px",
  },
  headerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.15)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3b82f6",
  },
  studentTitle: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  studentSubtitle: {
    fontSize: "14px",
    color: "#aaa",
    margin: "4px 0 0 0",
  },
  btnLogout: {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    fontFamily: "'Poppins', sans-serif",
  },
  errorAlert: {
    padding: "15px",
    borderRadius: "10px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    marginBottom: "25px",
    textAlign: "left",
  },
  emptyStateCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "60px 40px",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  emptyTitle: {
    fontSize: "20px",
    color: "#fff",
    margin: "0 0 10px 0",
    fontWeight: "600",
  },
  emptyText: {
    color: "#8c8c8c",
    fontSize: "14px",
    maxWidth: "500px",
    margin: "0 auto",
    lineHeight: "1.6",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "35px",
  },
  statCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    padding: "20px 25px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  statIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  statContent: {
    textAlign: "left",
  },
  statLabel: {
    fontSize: "12px",
    color: "#8c8c8c",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff",
    display: "block",
    marginTop: "2px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    textAlign: "left",
    marginBottom: "20px",
    letterSpacing: "-0.5px",
  },
  coursesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "25px",
  },
  courseCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "25px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    textAlign: "left",
    marginBottom: "15px",
  },
  courseCode: {
    fontSize: "12px",
    color: "#3b82f6",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  courseName: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "4px 0 0 0",
    color: "#fff",
  },
  badgeGreen: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10b981",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "700",
  },
  badgeYellow: {
    background: "rgba(245, 158, 11, 0.15)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    color: "#f59e0b",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "700",
  },
  badgeRed: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "700",
  },
  attendanceSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    marginBottom: "10px",
  },
  progressBar: {
    height: "6px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "3px",
    overflow: "hidden",
    marginBottom: "20px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.5s ease-in-out",
  },
  btnAccordion: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    width: "100%",
    fontFamily: "'Poppins', sans-serif",
  },
  logsWrapper: {
    marginTop: "15px",
    padding: "15px 5px 0 5px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    maxHeight: "180px",
    overflowY: "auto",
    textAlign: "left",
  },
  noLogs: {
    color: "#8c8c8c",
    fontSize: "13px",
    margin: 0,
    textAlign: "center",
  },
  logsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  logItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
  },
  logDate: {
    fontSize: "13px",
    color: "#d1d5db",
  },
  logStatus: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "6px",
  },
  btnCardCheckIn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    color: "#fff",
    boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif",
  },
  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
};
