import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AddStudent from "./AddStudent";
import EditRoom from "./EditRoom";
import { API_BASE_URL } from '../config';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';



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
  const [attendanceDates, setAttendanceDates] = useState([]);

  // Self Check-in states
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkInActive, setCheckInActive] = useState(false);
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInExpiresAt, setCheckInExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [duration, setDuration] = useState(5);
  const [requireLocation, setRequireLocation] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      navigate("/");
    } else if (role === "Student") {
      navigate("/student-dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    if (!checkInActive || !checkInExpiresAt) return;
    
    const interval = setInterval(() => {
      const ms = new Date(checkInExpiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setCheckInActive(false);
        setCheckInCode("");
        setCheckInExpiresAt(null);
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [checkInActive, checkInExpiresAt]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/getroom/${id}`);
        setRoom(res.data.room);
        
        if (res.data.room.checkInActive) {
          setCheckInActive(true);
          setCheckInCode(res.data.room.checkInCode);
          setCheckInExpiresAt(res.data.room.checkInExpiresAt);
          
          const ms = new Date(res.data.room.checkInExpiresAt).getTime() - Date.now();
          setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
        } else {
          setCheckInActive(false);
          setCheckInCode("");
          setCheckInExpiresAt(null);
          setTimeLeft(0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/getstudents/${id}`);
        setStudents(res.data.students);
        setAlertMsg("");
      } catch (err) {
        setAlertMsg(err.response?.data?.message || "Error fetching students");
      } finally {
        setLoading(false);
      }
    };

    const fetchAttendanceDates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/attendance-dates/${id}`);
        setAttendanceDates(res.data.dates || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoom();
    fetchStudents();
    fetchAttendanceDates();
  }, [id, refresh]);

  const handleDeleteStudent = async (studentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/delstudent/${studentId}`);
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async () => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      try {
        await axios.delete(`${API_BASE_URL}/del/${id}`);
        navigate(-1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        setLocError("Failed to retrieve location. Please check browser settings and allow location access.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleStartCheckIn = async () => {
    try {
      const payload = {
        duration: Number(duration)
      };
      if (requireLocation) {
        if (!userCoords) {
          setLocError("Location coordinates are required to start location-verified check-in.");
          return;
        }
        payload.latitude = userCoords.latitude;
        payload.longitude = userCoords.longitude;
      }
      
      const res = await axios.post(`${API_BASE_URL}/classroom/${id}/start-checkin`, payload);
      setCheckInActive(true);
      setCheckInCode(res.data.code);
      setCheckInExpiresAt(res.data.expiresAt);
      
      const ms = new Date(res.data.expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
      
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to start check-in session");
    }
  };

  const handleStopCheckIn = async () => {
    try {
      await axios.post(`${API_BASE_URL}/classroom/${id}/stop-checkin`);
      setCheckInActive(false);
      setCheckInCode("");
      setCheckInExpiresAt(null);
      setTimeLeft(0);
    } catch (err) {
      console.error(err);
      alert("Failed to stop check-in session");
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

        {/* Check-In Modal */}
        {checkInModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Self Check-in Portal</h3>
                <button style={styles.modalCloseBtn} onClick={() => setCheckInModal(false)}>×</button>
              </div>
              
              {checkInActive ? (
                <div style={styles.activeContainer}>
                  <div style={styles.activePulse}>
                    <div style={styles.pulseInner}></div>
                    <span style={styles.activeStatusText}>Check-in Session Active</span>
                  </div>
                  
                  <p style={styles.activeSubtext}>Ask students to visit their dashboard and enter the code below:</p>
                  
                  <div style={styles.codeWrapper}>
                    <div style={styles.codeLabel}>6-Digit PIN</div>
                    <div style={styles.codeDisplay}>{checkInCode}</div>
                  </div>
                  
                  <div style={styles.timerWrapper}>
                    <span style={styles.timerLabel}>Time Remaining:</span>
                    <span style={styles.timerValue}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <button 
                    style={{...styles.btn, ...styles.btnDelete, width: '100%', marginTop: '20px', justifyContent: 'center'}}
                    onClick={handleStopCheckIn}
                  >
                    Stop Check-in Session
                  </button>
                </div>
              ) : (
                <div style={styles.setupContainer}>
                  <p style={styles.setupSubtext}>Configure a temporary check-in window. Students must check-in during this time.</p>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Session Duration</label>
                    <select 
                      style={styles.selectField}
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)}
                    >
                      <option value={2}>2 Minutes</option>
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                    </select>
                  </div>

                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        style={styles.checkboxInput}
                        checked={requireLocation}
                        onChange={(e) => {
                          setRequireLocation(e.target.checked);
                          if (e.target.checked && !userCoords) {
                            handleGetLocation();
                          }
                        }}
                      />
                      Require GPS Location Verification
                    </label>
                    <p style={styles.checkboxSubtext}>Students must be within 50 meters of your current location to check in successfully.</p>
                  </div>

                  {requireLocation && (
                    <div style={styles.locStatusWrapper}>
                      {locLoading && <div style={styles.locInfoText}>Getting coordinates...</div>}
                      {locError && <div style={styles.locErrorText}>{locError}</div>}
                      {userCoords && (
                        <div style={styles.locSuccessText}>
                          Coordinates acquired: {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
                        </div>
                      )}
                      {!userCoords && !locLoading && !locError && (
                        <button style={styles.btnLocRetry} onClick={handleGetLocation}>
                          Acquire Coordinates
                        </button>
                      )}
                    </div>
                  )}

                  <button 
                    style={{
                      ...styles.btn, 
                      ...styles.btnAdd, 
                      width: '100%', 
                      marginTop: '20px',
                      opacity: (requireLocation && !userCoords) ? 0.6 : 1,
                      cursor: (requireLocation && !userCoords) ? 'not-allowed' : 'pointer',
                      justifyContent: 'center'
                    }}
                    disabled={requireLocation && !userCoords}
                    onClick={handleStartCheckIn}
                  >
                    Start Check-in Session
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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

            {!alertMsg && (
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnCheckin,
                  ...(hoveredButton === 'checkin' ? styles.btnCheckinHover : {}),
                  ...(checkInActive ? styles.btnCheckinActive : {}),
                  position: 'relative'
                }}
                onClick={() => setCheckInModal(true)}
                onMouseEnter={() => setHoveredButton('checkin')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={styles.btnIcon} fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 11l2 2 4-4" />
                </svg>
                <span>{checkInActive ? "Check-in Active" : "Self Check-in"}</span>
                {checkInActive && <span style={styles.pulseBadge}></span>}
              </button>
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

        {/* At-Risk Defaulter Banner */}
        {!alertMsg && room.days > 0 && students.some(st => (st.attendance / room.days) < 0.75) && (
          <div style={styles.defaulterAlertCard}>
            <div style={styles.defaulterHeader}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={styles.defaulterIcon}>
                <path
                  fill="#ef4444"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <h4 style={styles.defaulterTitle}>Defaulter Warning (Attendance below 75%)</h4>
            </div>
            <p style={styles.defaulterText}>
              The following students are currently at risk of attendance shortage:
            </p>
            <div style={styles.defaulterList}>
              {students
                .filter(st => (st.attendance / room.days) < 0.75)
                .map(st => (
                  <span key={st._id} style={styles.defaulterNameBadge}>
                    {st.name} ({(st.attendance / room.days * 100).toFixed(0)}%)
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Analytics Charts Section */}
        {!alertMsg && room.days > 0 && students.length > 0 && (
          <div style={styles.analyticsCard}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Classroom Analytics</h3>
              <div style={styles.analyticsBadge}>Live Insights</div>
            </div>
            
            <div style={styles.chartsGrid}>
              {/* Daily Trend Chart */}
              <div style={styles.chartWrapper}>
                <h4 style={styles.chartTitle}>Daily Attendance Trend (%)</h4>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={[...attendanceDates].reverse().map(d => ({
                        date: d.date.substring(5), // MM-DD for compactness
                        attendance: d.totalCount > 0 ? Math.round((d.presentCount / d.totalCount) * 100) : 0
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e50914" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#e50914" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#8c8c8c" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8c8c8c" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        labelStyle={{ color: '#fff', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="attendance" stroke="#e50914" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Student Distribution Chart */}
              <div style={styles.chartWrapper}>
                <h4 style={styles.chartTitle}>Individual Student Attendance (%)</h4>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={students.map(st => ({
                        name: st.name.split(' ')[0],
                        percentage: room.days > 0 ? Math.round((st.attendance / room.days) * 100) : 0
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke="#8c8c8c" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8c8c8c" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        labelStyle={{ color: '#fff', fontWeight: 600 }}
                      />
                      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                        {students.map((st, index) => {
                          const pct = room.days > 0 ? (st.attendance / room.days) * 100 : 0;
                          let fill = '#10b981'; // Green
                          if (pct < 75) fill = '#ef4444'; // Red
                          else if (pct < 85) fill = '#f59e0b'; // Yellow
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

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
                          {(() => {
                            const percentage = room.days > 0 ? (student.attendance / room.days) * 100 : 0;
                            let textColor = '#10b981';
                            let barBackground = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
                            let badgeStyle = styles.badgeGreen;

                            if (percentage < 75) {
                              textColor = '#ef4444';
                              barBackground = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                              badgeStyle = styles.badgeRed;
                            } else if (percentage < 85) {
                              textColor = '#f59e0b';
                              barBackground = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
                              badgeStyle = styles.badgeYellow;
                            }

                            return (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ ...styles.attendanceText, color: textColor }}>
                                    {student.attendance}/{room.days}
                                  </span>
                                  <span style={badgeStyle}>
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                                <div style={styles.progressBar}>
                                  <div
                                    style={{
                                      ...styles.progressFill,
                                      background: barBackground,
                                      width: `${percentage}%`,
                                    }}
                                  ></div>
                                </div>
                              </>
                            );
                          })()}
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

        {/* Attendance Logs History Section */}
        <div style={styles.historyCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Attendance History Logs</h3>
            <div style={styles.historyBadge}>{attendanceDates.length} Days Marked</div>
          </div>
          
          {attendanceDates.length === 0 ? (
            <div style={styles.noHistoryWrapper}>
              <svg width="40" height="40" viewBox="0 0 24 24" style={styles.noHistoryIcon}>
                <path
                  fill="currentColor"
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm-5-8H7v2h7v-2zm-3 4H7v2h4v-2z"
                />
              </svg>
              <p style={styles.noHistoryText}>No attendance sessions recorded yet.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Present / Total Students</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceDates.map((dateItem, idx) => (
                    <tr
                      key={dateItem.date}
                      style={{
                        ...styles.tr,
                        ...(hoveredRow === `history-${dateItem.date}` ? styles.trHover : {}),
                        animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s backwards`,
                      }}
                      onMouseEnter={() => setHoveredRow(`history-${dateItem.date}`)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={styles.td}>
                        <div style={styles.historyDate}>
                          <svg width="18" height="18" viewBox="0 0 24 24" style={styles.calendarIcon}>
                            <path
                              fill="currentColor"
                              d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"
                            />
                          </svg>
                          <span style={styles.dateText}>{dateItem.date}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.attendanceWrapper}>
                          <span style={styles.attendanceText}>
                            {dateItem.presentCount} / {dateItem.totalCount} present
                          </span>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${(dateItem.presentCount / dateItem.totalCount) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <Link to={`/markatt/${id}?date=${dateItem.date}`} style={styles.link}>
                          <button
                            style={{
                              ...styles.btnEditHistory,
                              ...(hoveredButton === `edit-hist-${dateItem.date}` ? styles.btnEditHistoryHover : {}),
                            }}
                            onMouseEnter={() => setHoveredButton(`edit-hist-${dateItem.date}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" style={styles.editHistIcon}>
                              <path
                                fill="currentColor"
                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                              />
                            </svg>
                            <span>Edit Session</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
  defaulterAlertCard: {
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "30px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    animation: "fadeInUp 0.6s ease-out",
  },
  defaulterHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  defaulterIcon: {
    flexShrink: 0,
    animation: "pulse 2s infinite",
  },
  defaulterTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#ef4444",
    margin: 0,
    letterSpacing: "0.5px",
  },
  defaulterText: {
    fontSize: "14px",
    color: "#d1d5db",
    margin: "0 0 16px 0",
    lineHeight: "1.5",
  },
  defaulterList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  defaulterNameBadge: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.3px",
  },
  analyticsCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "30px",
    animation: "fadeInUp 0.6s ease-out 0.1s backwards",
  },
  analyticsBadge: {
    background: "rgba(229, 9, 20, 0.2)",
    border: "1px solid rgba(229, 9, 20, 0.3)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e50914",
    letterSpacing: "0.5px",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "30px",
    marginTop: "20px",
  },
  chartWrapper: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    padding: "20px",
  },
  chartTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#e0e0e0",
    marginBottom: "15px",
    marginTop: 0,
    letterSpacing: "0.5px",
  },
  badgeRed: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#ef4444",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
  },
  badgeYellow: {
    background: "rgba(245, 158, 11, 0.2)",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    color: "#f59e0b",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
  },
  badgeGreen: {
    background: "rgba(16, 185, 129, 0.2)",
    border: "1px solid rgba(16, 185, 129, 0.4)",
    color: "#10b981",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
  },
  historyCard: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    animation: "fadeInUp 0.6s ease-out 0.3s backwards",
    marginTop: "40px",
  },
  historyBadge: {
    background: "rgba(59, 130, 246, 0.2)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    letterSpacing: "0.5px",
  },
  noHistoryWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    color: "#8c8c8c",
  },
  noHistoryIcon: {
    marginBottom: "15px",
    opacity: 0.5,
  },
  noHistoryText: {
    fontSize: "16px",
    fontWeight: "500",
    margin: 0,
  },
  historyDate: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  calendarIcon: {
    color: "#e50914",
  },
  dateText: {
    fontWeight: "600",
    color: "#fff",
  },
  btnEditHistory: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    padding: "8px 14px",
    borderRadius: "6px",
    color: "#f59e0b",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif",
  },
  btnEditHistoryHover: {
    background: "rgba(245, 158, 11, 0.2)",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(245, 158, 11, 0.15)",
  },
  editHistIcon: {
    flexShrink: 0,
  },
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "'Poppins', sans-serif",
    width: "100%",
  },

  container: {
    padding: "40px 20px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
    background: "transparent",
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
    background: "transparent",
    width: "100%",
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

  btnCheckin: {
    background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(6, 182, 212, 0.3)",
  },

  btnCheckinHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(6, 182, 212, 0.5)",
  },

  btnCheckinActive: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
  },

  pulseBadge: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    boxShadow: "0 0 8px #ef4444",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease",
  },

  modalContent: {
    background: "linear-gradient(145deg, #222222 0%, #181818 100%)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "30px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "15px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
  },

  modalCloseBtn: {
    background: "none",
    border: "none",
    color: "#8c8c8c",
    fontSize: "28px",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
    transition: "color 0.2s ease",
  },

  activeContainer: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },

  activePulse: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "8px 16px",
    borderRadius: "30px",
    marginBottom: "10px",
  },

  pulseInner: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 10px #10b981",
  },

  activeStatusText: {
    fontSize: "14px",
    color: "#10b981",
    fontWeight: "600",
  },

  activeSubtext: {
    fontSize: "14px",
    color: "#a3a3a3",
    lineHeight: "1.5",
    margin: "0 0 10px 0",
  },

  codeWrapper: {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "15px 30px",
    display: "inline-block",
    marginBottom: "15px",
  },

  codeLabel: {
    fontSize: "12px",
    color: "#8c8c8c",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  codeDisplay: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#06b6d4",
    letterSpacing: "4px",
  },

  timerWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "15px",
    color: "#e0e0e0",
  },

  timerLabel: {
    color: "#8c8c8c",
  },

  timerValue: {
    fontWeight: "700",
    color: "#ef4444",
    fontFamily: "monospace",
    fontSize: "18px",
  },

  setupContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  setupSubtext: {
    fontSize: "14px",
    color: "#a3a3a3",
    lineHeight: "1.5",
    margin: 0,
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  fieldLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#d4d4d4",
  },

  selectField: {
    backgroundColor: "#2e2e2e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "'Poppins', sans-serif",
    outline: "none",
  },

  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "500",
  },

  checkboxInput: {
    cursor: "pointer",
    accentColor: "#e50914",
    width: "16px",
    height: "16px",
  },

  checkboxSubtext: {
    margin: 0,
    fontSize: "12px",
    color: "#8c8c8c",
    lineHeight: "1.4",
    paddingLeft: "26px",
  },

  locStatusWrapper: {
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
  },

  locInfoText: {
    color: "#e0e0e0",
  },

  locErrorText: {
    color: "#ef4444",
    fontWeight: "500",
  },

  locSuccessText: {
    color: "#10b981",
    fontWeight: "500",
  },

  btnLocRetry: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: "600",
    padding: 0,
  },
};