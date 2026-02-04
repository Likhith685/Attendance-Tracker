import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AddStudent from "./AddStudent";
import EditRoom from "./EditRoom";

export default function ViewCroom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [editRoomModal, setEditRoomModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/getroom/${id}`);
        setRoom(res.data.room);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchStudents = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/getstudents/${id}`);
        setStudents(res.data.students);
        setAlertMsg("");
      } catch (err) {
        setAlertMsg(err.response?.data?.message || "Error fetching students");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
    fetchStudents();
  }, [id, refresh]);

  const handleDeleteStudent = async (studentId) => {
    try {
      await axios.delete(`http://localhost:5000/delstudent/${studentId}`);
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async () => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      try {
        await axios.delete(`http://localhost:5000/del/${id}`);
        navigate(-1);
      } catch (err) {
        console.error(err);
      }
    }
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
          <p style={styles.loaderText}>Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Modals */}
        <AddStudent
          trigger={addStudentModal}
          setTrigger={setAddStudentModal}
          roomid={room._id}
          reload={refresh}
          setreload={setRefresh}
        />
        <EditRoom
          idx={room._id}
          trigger={editRoomModal}
          setTrigger={setEditRoomModal}
          reload={refresh}
          setreload={setRefresh}
          cname={room.cname}
          ccode={room.ccode}
          days={room.days}
        />

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

        {/* Room Card */}
        <div style={styles.roomCard}>
          <div style={styles.roomHeader}>
            <div style={styles.roomBadge}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={styles.badgeIcon}>
                <path
                  fill="currentColor"
                  d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                />
              </svg>
            </div>
            <h2 style={styles.roomCode}>{room.ccode}</h2>
          </div>
          
          <h3 style={styles.roomName}>{room.cname}</h3>
          
          <div style={styles.roomStats}>
            <div style={styles.statCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={styles.statIcon}>
                <path
                  fill="#10b981"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Strength</span>
                <span style={styles.statValue}>{room.strength}</span>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={styles.statIcon}>
                <path
                  fill="#3b82f6"
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"
                />
              </svg>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Total Days</span>
                <span style={styles.statValue}>{room.days}</span>
              </div>
            </div>
          </div>

          <div style={styles.roomActions}>
            <button
              style={{
                ...styles.btn,
                ...styles.btnAdd,
                ...(hoveredButton === 'add' ? styles.btnAddHover : {}),
              }}
              onClick={() => setAddStudentModal(true)}
              onMouseEnter={() => setHoveredButton('add')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                <path
                  fill="currentColor"
                  d="M9 0a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H1a1 1 0 110-2h7V1a1 1 0 011-1z"
                />
              </svg>
              <span>Add Student</span>
            </button>

            {!alertMsg && (
              <Link to={`/markatt/${id}`} style={styles.link}>
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnMark,
                    ...(hoveredButton === 'mark' ? styles.btnMarkHover : {}),
                  }}
                  onMouseEnter={() => setHoveredButton('mark')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                    <path
                      fill="currentColor"
                      d="M7 14l-4-4 1.41-1.41L7 11.17l7.59-7.59L16 5l-9 9z"
                    />
                  </svg>
                  <span>Mark Attendance</span>
                </button>
              </Link>
            )}

            <button
              style={{
                ...styles.btn,
                ...styles.btnEdit,
                ...(hoveredButton === 'edit' ? styles.btnEditHover : {}),
              }}
              onClick={() => setEditRoomModal(true)}
              onMouseEnter={() => setHoveredButton('edit')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                <path
                  fill="currentColor"
                  d="M0 14.25V18h3.75L14.81 6.94l-3.75-3.75L0 14.25zM17.71 4.04a1 1 0 000-1.41L15.37.29a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              <span>Edit Classroom</span>
            </button>

            <button
              style={{
                ...styles.btn,
                ...styles.btnDelete,
                ...(hoveredButton === 'delete' ? styles.btnDeleteHover : {}),
              }}
              onClick={handleDeleteRoom}
              onMouseEnter={() => setHoveredButton('delete')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                <path
                  fill="currentColor"
                  d="M14 2h-3.5l-1-1h-5l-1 1H0v2h14V2zM1 16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4H1v12z"
                />
              </svg>
              <span>Delete Classroom</span>
            </button>
          </div>
        </div>

        {/* Student Table */}
        {alertMsg ? (
          <div style={styles.alertCard}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={styles.alertIcon}>
              <circle cx="30" cy="30" r="28" fill="rgba(229, 9, 20, 0.1)" />
              <path
                fill="#e50914"
                d="M30 10c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm2 30h-4v-4h4v4zm0-8h-4V18h4v14z"
              />
            </svg>
            <h2 style={styles.alertText}>{alertMsg}</h2>
            <p style={styles.alertSubtext}>Add students to get started</p>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Students List</h3>
              <div style={styles.tableBadge}>{students.length} Students</div>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Roll No.</th>
                    <th style={styles.th}>Attendance</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr
                      key={student._id}
                      style={{
                        ...styles.tr,
                        ...(hoveredRow === student._id ? styles.trHover : {}),
                        animation: `fadeInUp 0.4s ease-out ${index * 0.05}s backwards`,
                      }}
                      onMouseEnter={() => setHoveredRow(student._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={styles.td}>
                        <div style={styles.studentName}>
                          <div style={styles.avatar}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.rollBadge}>{student.roll}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.attendanceWrapper}>
                          <span style={styles.attendanceText}>
                            {student.attendance}/{room.days}
                          </span>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${(student.attendance / room.days) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={{
                            ...styles.btnTableDelete,
                            ...(hoveredButton === `delete-${student._id}` ? styles.btnTableDeleteHover : {}),
                          }}
                          onClick={() => handleDeleteStudent(student._id)}
                          onMouseEnter={() => setHoveredButton(`delete-${student._id}`)}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16">
                            <path
                              fill="currentColor"
                              d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"
                            />
                            <path
                              fillRule="evenodd"
                              d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

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

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(to right, #ffffff 0%, #ffffff 15%, #000000 15%, #000000 85%, #ffffff 85%, #ffffff 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "'Poppins', sans-serif",
  },

  container: {
    padding: "40px 20px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
    background: "#000000",
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
  },

  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#000000",
    width: "70%",
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

  roomCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(229, 9, 20, 0.2)",
    marginBottom: "40px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    animation: "fadeInUp 0.6s ease-out",
  },

  roomHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },

  roomBadge: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(229, 9, 20, 0.4)",
  },

  badgeIcon: {
    opacity: 0.9,
  },

  roomCode: {
    fontSize: "42px",
    fontWeight: "700",
    margin: 0,
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "1px",
  },

  roomName: {
    fontSize: "28px",
    color: "#fff",
    marginBottom: "30px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  roomStats: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "rgba(255, 255, 255, 0.03)",
    padding: "20px 30px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  statIcon: {
    flexShrink: 0,
  },

  statContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
  },

  statLabel: {
    fontSize: "13px",
    color: "#8c8c8c",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },

  statValue: {
    fontSize: "24px",
    color: "#fff",
    fontWeight: "700",
  },

  roomActions: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  btn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 24px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    letterSpacing: "0.3px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "'Poppins', sans-serif",
  },

  btnIcon: {
    transition: "transform 0.3s ease",
  },

  link: {
    textDecoration: "none",
  },

  btnAdd: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
  },

  btnAddHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(16, 185, 129, 0.5)",
  },

  btnMark: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
  },

  btnMarkHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(245, 158, 11, 0.5)",
  },

  btnEdit: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
  },

  btnEditHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(59, 130, 246, 0.5)",
  },

  btnDelete: {
    background: "linear-gradient(135deg, #e50914 0%, #b00710 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(229, 9, 20, 0.3)",
  },

  btnDeleteHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(229, 9, 20, 0.5)",
  },

  alertCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "60px 40px",
    textAlign: "center",
    border: "1px solid rgba(229, 9, 20, 0.2)",
    animation: "fadeInUp 0.6s ease-out",
  },

  alertIcon: {
    marginBottom: "20px",
    filter: "drop-shadow(0 0 20px rgba(229, 9, 20, 0.3))",
  },

  alertText: {
    fontSize: "24px",
    color: "#e50914",
    marginBottom: "10px",
    fontWeight: "600",
  },

  alertSubtext: {
    color: "#8c8c8c",
    fontSize: "16px",
  },

  tableCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    animation: "fadeInUp 0.6s ease-out 0.2s backwards",
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
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#fff",
    flexShrink: 0,
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

  attendanceWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  attendanceText: {
    fontWeight: "600",
    color: "#10b981",
    fontSize: "15px",
  },

  progressBar: {
    width: "100px",
    height: "6px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
    transition: "width 0.6s ease",
    borderRadius: "3px",
  },

  btnTableDelete: {
    background: "rgba(229, 9, 20, 0.1)",
    border: "1px solid rgba(229, 9, 20, 0.3)",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#e50914",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  btnTableDeleteHover: {
    background: "rgba(229, 9, 20, 0.2)",
    transform: "scale(1.1)",
  },
};