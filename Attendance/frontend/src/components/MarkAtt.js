import axios from "axios";
import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from '../config';

function MarkAtt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setdata] = React.useState({});
  const [stud, setstud] = React.useState([]);
  const [load, setload] = React.useState(false);
  const [binary, setbinary] = React.useState([]);
  const [hoveredButton, setHoveredButton] = React.useState(null);
  const [hoveredRow, setHoveredRow] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      navigate("/");
    } else if (role === "Student") {
      navigate("/student-dashboard");
    }
  }, [navigate]);

  // Get local date formatted as YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = React.useState(
    searchParams.get("date") || getLocalDateString()
  );
  const [isExistingRecord, setIsExistingRecord] = React.useState(false);

  // fetch room details
  React.useEffect(() => {
    axios
      .get(`${API_BASE_URL}/getroom/${id}`)
      .then((res) => {
        setdata(res.data.room);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message, {
          position: "top-right",
          theme: "dark",
        });
      });
  }, [id]);

  // fetch students list once
  React.useEffect(() => {
    axios
      .get(`${API_BASE_URL}/getstudents/${id}`)
      .then((res) => {
        setstud(res.data.students || []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message, {
          position: "top-right",
          theme: "dark",
        });
      });
  }, [id]);

  // fetch attendance for selectedDate or initialize binary to 0
  React.useEffect(() => {
    if (stud.length === 0) return;

    setload(false);
    axios
      .get(`${API_BASE_URL}/attendance/${id}/${selectedDate}`)
      .then((res) => {
        const record = res.data.record;
        setIsExistingRecord(true);

        const recordStatusMap = {};
        record.records.forEach((rec) => {
          if (rec.studentId) {
            recordStatusMap[rec.studentId.toString()] = rec.status;
          }
        });

        setbinary(
          stud.map((st) => ({
            name: st.name,
            value: recordStatusMap[st._id.toString()] === 'Present' ? 1 : 0,
          }))
        );
        setload(true);
      })
      .catch((err) => {
        // Attendance not marked for this date yet
        setIsExistingRecord(false);
        setbinary(
          stud.map((st) => ({
            name: st.name,
            value: 0,
          }))
        );
        setload(true);
      });
  }, [id, selectedDate, stud]);

  // confirm attendance
  const handleConf = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API_BASE_URL}/confirmed/${id}`, {
        binary,
        date: selectedDate
      });
      toast.success(
        isExistingRecord
          ? "Attendance updated successfully!"
          : "Attendance marked successfully!",
        {
          position: "top-right",
          theme: "dark",
        }
      );
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, {
        position: "top-right",
        theme: "dark",
      });
      setIsSubmitting(false);
    }
  };

  // toggle attendance for a student
  const handleClick = (idx) => {
    setbinary((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, value: item.value ? 0 : 1 } : item
      )
    );
  };

  // Calculate statistics
  const presentCount = binary.filter(b => b.value === 1).length;
  const absentCount = binary.length - presentCount;
  const attendancePercentage = binary.length > 0 ? Math.round((presentCount / binary.length) * 100) : 0;

  return load ? (
    <div className="mark-att-container" style={styles.container}>
      {/* Back Button */}
      <button
        style={{
          ...styles.btnBack,
          ...(hoveredButton === 'back' ? styles.btnBackHover : {}),
        }}
        onClick={() => navigate(-1)}
        onMouseEnter={() => setHoveredButton('back')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" style={styles.backIcon}>
          <path
            fill="currentColor"
            d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 1.414L4.414 10l6.293 6.293A1 1 0 0110 18z"
          />
        </svg>
        <span>Back</span>
      </button>

      {/* Header Card */}
      <div className="mark-att-header-card" style={styles.headerCard}>
        <div style={styles.headerIcon}>
          <svg width="50" height="50" viewBox="0 0 50 50">
            <defs>
              <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#e50914", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#ff4757", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M25 5L30 15L40 17L32.5 24.5L34.5 35L25 29.5L15.5 35L17.5 24.5L10 17L20 15L25 5Z"
              fill="url(#headerGradient)"
            />
          </svg>
        </div>
        <h1 style={styles.title}>{data.cname}</h1>
        <div style={styles.dateSelectorContainer}>
          <label style={styles.dateLabel} htmlFor="attendance-date">
            Attendance Session Date:
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.dateInput}
            className="date-input"
          />
          {isExistingRecord && (
            <p style={styles.editingBadge}>
              ⚠️ Viewing marked session. Updates will edit existing attendance.
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="mark-att-stats-container" style={styles.statsContainer}>
          <div style={styles.statBox}>
            <span style={styles.statValue}>{binary.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: '#10b981' }}>{presentCount}</span>
            <span style={styles.statLabel}>Present</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: '#ef4444' }}>{absentCount}</span>
            <span style={styles.statLabel}>Absent</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statValue, color: '#3b82f6' }}>{attendancePercentage}%</span>
            <span style={styles.statLabel}>Attendance</span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="mark-att-table-card" style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Student Attendance</h3>
          <div style={styles.tableBadge}>{stud.length} Students</div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Roll No.</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stud.map((student, idx) => (
                <tr
                  key={idx}
                  style={{
                    ...styles.tr,
                    ...(hoveredRow === idx ? styles.trHover : {}),
                    animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s backwards`,
                  }}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.td}>
                    <div style={styles.studentName}>
                      <div style={{
                        ...styles.avatar,
                        ...(binary[idx]?.value ? styles.avatarPresent : styles.avatarAbsent),
                      }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{student.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.rollBadge}>{student.roll}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.tabbtns}>
                      {!binary[idx]?.value ? (
                        <button
                          style={{
                            ...styles.presbtn,
                            ...(hoveredButton === `present-${idx}` ? styles.presbtnHover : {}),
                          }}
                          onClick={() => handleClick(idx)}
                          onMouseEnter={() => setHoveredButton(`present-${idx}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" style={styles.btnIcon}>
                            <path
                              fill="currentColor"
                              d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"
                            />
                          </svg>
                          <span>Mark Present</span>
                        </button>
                      ) : (
                        <button
                          style={{
                            ...styles.absbtn,
                            ...(hoveredButton === `absent-${idx}` ? styles.absbtnHover : {}),
                          }}
                          onClick={() => handleClick(idx)}
                          onMouseEnter={() => setHoveredButton(`absent-${idx}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" style={styles.btnIcon}>
                            <path
                              fill="currentColor"
                              d="M2.146 2.854a.5.5 0 11.708-.708L8 7.293l5.146-5.147a.5.5 0 01.708.708L8.707 8l5.147 5.146a.5.5 0 01-.708.708L8 8.707l-5.146 5.147a.5.5 0 01-.708-.708L7.293 8 2.146 2.854z"
                            />
                          </svg>
                          <span>Mark Absent</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note & Confirm Button */}
      <div style={styles.footerSection}>
        <div style={styles.noteCard}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={styles.noteIcon}>
            <path
              fill="#f59e0b"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          <div>
            <p style={styles.noteTitle}>Important</p>
            <p style={styles.noteText}>
              Please click confirm only if attendance for everyone has been marked and is final. Otherwise, click BACK.
            </p>
          </div>
        </div>

        <button
          style={{
            ...styles.confbtn,
            ...(hoveredButton === 'confirm' ? styles.confbtnHover : {}),
            ...(isSubmitting ? styles.confbtnLoading : {}),
          }}
          onClick={handleConf}
          onMouseEnter={() => setHoveredButton('confirm')}
          onMouseLeave={() => setHoveredButton(null)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div style={styles.spinner}></div>
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" style={styles.confirmIcon}>
                <path
                  fill="currentColor"
                  d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
                />
              </svg>
              <span>Confirm Attendance</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .date-input:focus {
          border-color: rgba(229, 9, 20, 0.6) !important;
          box-shadow: 0 0 15px rgba(229, 9, 20, 0.3) !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  ) : (
    <div style={styles.loaderContainer}>
      <div style={styles.loader}>
        <div style={styles.loaderRing}></div>
        <div style={styles.loaderRing}></div>
        <div style={styles.loaderRing}></div>
      </div>
      <p style={styles.loaderText}>Loading attendance sheet...</p>
    </div>
  );
}

const styles = {
  dateSelectorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "10px",
    marginBottom: "20px",
  },
  dateLabel: {
    color: "#b3b3b3",
    fontSize: "14px",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
  dateInput: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    fontFamily: "'Poppins', sans-serif",
    outline: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
  },
  editingBadge: {
    color: "#f59e0b",
    fontSize: "13px",
    fontWeight: "500",
    margin: "5px 0 0 0",
  },
  container: {
    padding: "40px 20px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
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
    borderTopColor: "#e50914",
    borderRadius: "50%",
    animation: "spin 1.5s linear infinite",
  },

  loaderText: {
    marginTop: "30px",
    color: "#b3b3b3",
    fontSize: "18px",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },

  btnBack: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "30px",
    color: "#e0e0e0",
    fontWeight: "500",
    fontSize: "15px",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif",
  },

  btnBackHover: {
    background: "rgba(255, 255, 255, 0.1)",
    transform: "translateX(-5px)",
  },

  backIcon: {
    transition: "transform 0.3s ease",
  },

  headerCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(229, 9, 20, 0.2)",
    marginBottom: "40px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    animation: "fadeInUp 0.6s ease-out",
  },

  headerIcon: {
    display: "inline-flex",
    marginBottom: "20px",
    filter: "drop-shadow(0 0 30px rgba(229, 9, 20, 0.5))",
  },

  title: {
    fontSize: "36px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "10px",
    letterSpacing: "0.5px",
  },

  subtitle: {
    color: "#b3b3b3",
    fontSize: "16px",
    marginBottom: "30px",
    fontWeight: "400",
  },

  statsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    flexWrap: "wrap",
    marginTop: "30px",
  },

  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "20px 30px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    minWidth: "120px",
  },

  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#fff",
  },

  statLabel: {
    fontSize: "13px",
    color: "#8c8c8c",
    fontWeight: "500",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  tableCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    animation: "fadeInUp 0.6s ease-out 0.2s backwards",
    marginBottom: "30px",
  },

  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },

  tableTitle: {
    fontSize: "24px",
    color: "#fff",
    margin: 0,
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  tableBadge: {
    background: "rgba(229, 9, 20, 0.2)",
    border: "1px solid rgba(229, 9, 20, 0.3)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e50914",
    letterSpacing: "0.5px",
  },

  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },

  th: {
    padding: "16px 20px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "600",
    color: "#8c8c8c",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.02)",
  },

  tr: {
    transition: "all 0.3s ease",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },

  trHover: {
    background: "rgba(255, 255, 255, 0.03)",
  },

  td: {
    padding: "20px",
    fontSize: "15px",
    color: "#e0e0e0",
  },

  studentName: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#fff",
    flexShrink: 0,
    transition: "all 0.3s ease",
  },

  avatarAbsent: {
    background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  },

  avatarPresent: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },

  rollBadge: {
    background: "rgba(59, 130, 246, 0.2)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    display: "inline-block",
  },

  tabbtns: {
    display: "flex",
    justifyContent: "flex-start",
  },

  presbtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
    fontFamily: "'Poppins', sans-serif",
  },

  presbtnHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.5)",
  },

  absbtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
    fontFamily: "'Poppins', sans-serif",
  },

  absbtnHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(239, 68, 68, 0.5)",
  },

  btnIcon: {
    flexShrink: 0,
  },

  footerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    animation: "fadeInUp 0.6s ease-out 0.4s backwards",
  },

  noteCard: {
    display: "flex",
    gap: "15px",
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: "12px",
    padding: "20px",
  },

  noteIcon: {
    flexShrink: 0,
  },

  noteTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: "5px",
  },

  noteText: {
    fontSize: "14px",
    color: "#d1d5db",
    lineHeight: "1.6",
    margin: 0,
  },

  confbtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: "linear-gradient(135deg, #e50914 0%, #b00710 100%)",
    border: "none",
    padding: "18px 40px",
    borderRadius: "12px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "18px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 30px rgba(229, 9, 20, 0.4)",
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    letterSpacing: "0.5px",
    fontFamily: "'Poppins', sans-serif",
  },

  confbtnHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 40px rgba(229, 9, 20, 0.6)",
  },

  confbtnLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },

  confirmIcon: {
    transition: "transform 0.3s ease",
  },

  spinner: {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default MarkAtt;