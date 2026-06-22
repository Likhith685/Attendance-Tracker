import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function StudentCheckIn() {
  const { roomid } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [code, setCode] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const roll = localStorage.getItem("roll");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !roll) {
      navigate("/");
      return;
    }

    const fetchRoom = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/getroom/${roomid}`);
        setRoom(res.data.room);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to retrieve classroom details. Make sure the classroom exists.");
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRoom();
    // Get geolocation on load
    handleGetLocation();
  }, [roomid, token, roll, navigate]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("GPS Location is not supported by your browser");
      return;
    }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        setLocError("Location access denied or failed. Please check permissions.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setErrorMsg("Please enter a valid 6-digit PIN.");
      return;
    }
    
    setErrorMsg("");
    setSuccessMsg("");
    setCheckingIn(true);

    try {
      const payload = {
        roomid,
        roll: Number(roll),
        code: code.trim(),
        latitude: coords ? coords.latitude : undefined,
        longitude: coords ? coords.longitude : undefined
      };

      const res = await axios.post(`http://localhost:5000/student/check-in`, payload, {
        headers: { token }
      });

      setSuccessMsg(res.data.message);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Check-in failed. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loadingRoom) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loaderContainer}>
          <div style={styles.loader}>
            <div style={styles.loaderRing}></div>
            <div style={styles.loaderRing}></div>
            <div style={styles.loaderRing}></div>
          </div>
          <p style={styles.loaderText}>Loading check-in page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-checkin-page-wrapper" style={styles.pageWrapper}>
      <div className="student-checkin-container" style={styles.container}>
        
        {/* Back link */}
        <button style={styles.btnBack} onClick={() => navigate("/student-dashboard")}>
          <svg width="20" height="20" viewBox="0 0 20 20" style={styles.backIcon}>
            <path
              fill="currentColor"
              d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 1.414L4.414 10l6.293 6.293A1 1 0 0110 18z"
            />
          </svg>
          <span>Dashboard</span>
        </button>

        <div className="student-checkin-card" style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.title}>Self Check-in</h2>
            <div style={styles.badge}>{room?.ccode}</div>
          </div>

          <p style={styles.subtitle}>
            Checking in to: <strong style={{ color: "#fff" }}>{room?.cname}</strong>
          </p>

          <div style={styles.divider}></div>

          {successMsg ? (
            <div style={styles.successArea}>
              <div style={styles.successIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 style={styles.successTitle}>Attendance Marked!</h3>
              <p style={styles.successText}>{successMsg}</p>
              
              <button 
                style={styles.btnDashboard}
                onClick={() => navigate("/student-dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckInSubmit} style={styles.form}>
              
              {/* Roll details */}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Marking Attendance For:</span>
                <span style={styles.infoValue}>Roll: {roll}</span>
              </div>

              {/* Geolocation Section */}
              <div style={styles.locContainer}>
                <div style={styles.locHeader}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: coords ? "#10b981" : "#8c8c8c"}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span style={styles.locTitle}>GPS Location Verification</span>
                </div>
                
                <div style={styles.locContent}>
                  {locLoading ? (
                    <span style={styles.locStatus}>Fetching location coords...</span>
                  ) : coords ? (
                    <span style={styles.locCoords}>
                      Coordinates: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                    </span>
                  ) : (
                    <span style={styles.locError}>{locError || "Location access is required."}</span>
                  )}

                  <button 
                    type="button" 
                    onClick={handleGetLocation} 
                    style={styles.btnRefreshLoc}
                  >
                    Refresh GPS
                  </button>
                </div>
              </div>

              {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

              {/* PIN input */}
              <div style={styles.formGroup}>
                <label htmlFor="pin-input" style={styles.inputLabel}>Enter 6-Digit check-in Code</label>
                <input
                  id="pin-input"
                  type="text"
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  style={styles.inputField}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={checkingIn}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.btnSubmit,
                  opacity: checkingIn ? 0.7 : 1,
                  cursor: checkingIn ? "not-allowed" : "pointer"
                }}
                disabled={checkingIn}
              >
                {checkingIn ? "Verifying Check-in..." : "Submit Check-in"}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    color: "#fff",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Poppins', sans-serif",
    width: "100%",
  },
  container: {
    width: "100%",
    maxWidth: "500px",
    marginTop: "20px",
  },
  btnBack: {
    background: "none",
    border: "none",
    color: "#8c8c8c",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    marginBottom: "20px",
    transition: "color 0.2s ease",
  },
  backIcon: {
    transition: "transform 0.2s ease",
  },
  card: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "35px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: "#fff",
    letterSpacing: "0.5px",
  },
  badge: {
    background: "rgba(229, 9, 20, 0.2)",
    border: "1px solid rgba(229, 9, 20, 0.3)",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#e50914",
    letterSpacing: "0.5px",
  },
  subtitle: {
    margin: "0 0 20px 0",
    color: "#8c8c8c",
    fontSize: "15px",
  },
  divider: {
    height: "1px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "12px 18px",
    borderRadius: "10px",
    fontSize: "14px",
  },
  infoLabel: {
    color: "#8c8c8c",
  },
  infoValue: {
    fontWeight: "600",
    color: "#3b82f6",
  },
  locContainer: {
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "10px",
    padding: "15px 18px",
  },
  locHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  locTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e0e0e0",
  },
  locContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    gap: "10px",
  },
  locStatus: {
    color: "#8c8c8c",
  },
  locCoords: {
    color: "#10b981",
    fontWeight: "500",
  },
  locError: {
    color: "#ef4444",
    fontWeight: "500",
  },
  btnRefreshLoc: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    padding: 0,
  },
  errorAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  inputLabel: {
    fontSize: "14px",
    color: "#d4d4d4",
    fontWeight: "500",
  },
  inputField: {
    backgroundColor: "#1c1c1c",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "14px",
    color: "#fff",
    fontSize: "24px",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: "8px",
    fontFamily: "monospace",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  btnSubmit: {
    background: "linear-gradient(135deg, #e50914 0%, #b00710 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    boxShadow: "0 4px 20px rgba(229, 9, 20, 0.3)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    marginTop: "10px",
    fontFamily: "'Poppins', sans-serif",
  },
  successArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "20px 0",
    gap: "15px",
  },
  successIcon: {
    filter: "drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))",
    marginBottom: "5px",
  },
  successTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#10b981",
    fontWeight: "600",
  },
  successText: {
    margin: 0,
    color: "#a3a3a3",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  btnDashboard: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
    marginTop: "15px",
    fontFamily: "'Poppins', sans-serif",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
  },
  loader: {
    position: "relative",
    width: "50px",
    height: "50px",
  },
  loaderRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    border: "4px solid transparent",
    borderTopColor: "#e50914",
    borderRadius: "50%",
    animation: "spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
  },
  loaderText: {
    color: "#8c8c8c",
    marginTop: "20px",
    fontSize: "14px",
  },
};
