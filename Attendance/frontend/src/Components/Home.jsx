import React from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [rooms, setRooms] = React.useState([]);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [loadingRooms, setLoadingRooms] = React.useState(true);
  const [header, setHeader] = React.useState("Your Classrooms");
  const [hoveredCard, setHoveredCard] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      navigate("/");
    } else if (role === "Student") {
      navigate("/student-dashboard");
    }
  }, [navigate]);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get("http://localhost:5000/user", {
        headers: { token },
      })
      .then((res) => {
        setUser(res.data);
        setLoadingUser(false);
      })
      .catch((err) => {
        console.log(err);
        setLoadingUser(false);
      });
  }, []);

  React.useEffect(() => {
    if (user) {
      axios
        .get(`http://localhost:5000/getrooms/${user.userid}`)
        .then((res) => {
          setRooms(res.data.rooms);
          setLoadingRooms(false);
        })
        .catch((err) => {
          console.log(err);
          setHeader("Welcome to IITI Classrooms");
          setLoadingRooms(false);
        });
    }
  }, [user]);

  const truncate = (str, len = 20) =>
    str.length > len ? str.substring(0, len - 3) + "..." : str;

  if (loadingUser || loadingRooms) {
    return <div style={styles.loader}>Loading...</div>;
  }

return (
      <div className="home-container" style={styles.container}>
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
          style={styles.toastContainer}
        />
        
        <div style={styles.header}>
          <h1 className="home-title" style={styles.title}>{header}</h1>
          <div style={styles.titleUnderline}></div>
        </div>
        
        <div className="home-grid" style={styles.grid}>
          {rooms.map((room, index) => (
            <div
              key={room._id}
              style={{
                ...styles.card,
                ...(hoveredCard === room._id ? styles.cardHover : {}),
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`,
              }}
              onMouseEnter={() => setHoveredCard(room._id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div 
                style={{
                  ...styles.cardGlow,
                  opacity: hoveredCard === room._id ? 1 : 0,
                }}
              ></div>
              
              <div style={styles.cardContent}>
                <div style={styles.codeWrapper}>
                  <p style={styles.code}>{truncate(room.ccode)}</p>
                  <div style={styles.codeBadge}>ID</div>
                </div>
                
                <p style={styles.name}>{truncate(room.cname, 30)}</p>
                
                <div style={styles.strengthWrapper}>
                  <svg width="16" height="16" viewBox="0 0 16 16" style={styles.icon}>
                    <path
                      fill="#e50914"
                      d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
                    />
                    <circle cx="8" cy="8" r="4" fill="#e50914" />
                  </svg>
                  <p style={styles.strength}>Strength: {room.strength}</p>
                </div>
                
                <Link to={`/view/${room._id}`} style={styles.link}>
                  <button
                    style={{
                      ...styles.enterBtn,
                      ...(hoveredCard === room._id ? styles.enterBtnHover : {}),
                    }}
                  >
                    <span style={styles.btnText}>Enter Room</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" style={styles.btnIcon}>
                      <path
                        fill="currentColor"
                        d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z"
                      />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}

const styles = {
  container: {
    padding: "60px 40px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
    position: "relative",
    overflow: "hidden",
  },
  
  toastContainer: {
    zIndex: 9999,
  },
  
  header: {
    textAlign: "center",
    marginBottom: "60px",
    position: "relative",
    zIndex: 2,
  },
  
  title: {
    fontSize: "56px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "20px",
    letterSpacing: "-1px",
    filter: "drop-shadow(0 0 40px rgba(229, 9, 20, 0.3))",
  },
  
  titleUnderline: {
    width: "120px",
    height: "4px",
    background: "linear-gradient(90deg, transparent, #e50914, transparent)",
    margin: "0 auto",
    borderRadius: "2px",
    animation: "shimmer 2s infinite",
  },
  
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 20px",
  },
  
  card: {
    background: "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
    borderRadius: "16px",
    padding: "32px 24px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
  },
  
  cardHover: {
    transform: "translateY(-12px) scale(1.03)",
    boxShadow: "0 20px 50px rgba(229, 9, 20, 0.25), 0 0 30px rgba(6, 182, 212, 0.25)",
    border: "1px solid rgba(6, 182, 212, 0.5)",
  },
  
  cardGlow: {
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle, rgba(229, 9, 20, 0.2) 0%, transparent 70%)",
    transition: "opacity 0.4s ease",
    pointerEvents: "none",
  },
  
  cardContent: {
    position: "relative",
    zIndex: 1,
  },
  
  codeWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  
  code: {
    fontSize: "48px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #e50914 0%, #ff4757 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "2px",
    margin: 0,
    filter: "drop-shadow(0 0 30px rgba(229, 9, 20, 0.5))",
  },
  
  codeBadge: {
    background: "rgba(229, 9, 20, 0.2)",
    border: "1px solid rgba(229, 9, 20, 0.4)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#e50914",
    letterSpacing: "1px",
  },
  
  name: {
    fontSize: "22px",
    marginBottom: "16px",
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: "0.5px",
    margin: "0 0 16px 0",
    lineHeight: "1.4",
  },
  
  strengthWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px",
  },
  
  icon: {
    flexShrink: 0,
  },
  
  strength: {
    fontSize: "14px",
    color: "#8c8c8c",
    fontWeight: "400",
    letterSpacing: "0.3px",
    margin: 0,
  },
  
  link: {
    textDecoration: "none",
    display: "block",
  },
  
  enterBtn: {
    backgroundColor: "#e50914",
    border: "none",
    color: "#ffffff",
    padding: "14px 32px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    width: "100%",
    boxShadow: "0 4px 20px rgba(229, 9, 20, 0.3)",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    position: "relative",
    overflow: "hidden",
  },
  
  enterBtnHover: {
    backgroundColor: "#f40612",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(229, 9, 20, 0.5)",
  },
  
  btnText: {
    position: "relative",
    zIndex: 1,
  },
  
  btnIcon: {
    position: "relative",
    zIndex: 1,
    transition: "transform 0.3s ease",
  },
};