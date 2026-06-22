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

  // Bulk CSV import state
  const [activeTab, setActiveTab] = useState("single");
  const [csvFile, setCsvFile] = useState(null);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const { data, errors } = parseCSV(text);
      setParsedStudents(data);
      setCsvErrors(errors);
    };
    reader.onerror = () => {
      setCsvErrors(["Failed to read CSV file."]);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    const results = [];
    const errors = [];
    const rolls = new Set();
    
    let startIdx = 0;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes("name") || firstLine.includes("roll")) {
        startIdx = 1;
      }
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(",").map(col => col.trim());
      if (columns.length < 2) {
        errors.push(`Row ${i + 1}: Must have at least Name and Roll Number.`);
        continue;
      }
      
      const name = columns[0];
      const rollStr = columns[1];
      const roll = Number(rollStr);
      const attendanceStr = columns[2];
      const attendance = attendanceStr ? Number(attendanceStr) : 0;
      
      if (!name) {
        errors.push(`Row ${i + 1}: Name is empty.`);
        continue;
      }
      if (isNaN(roll)) {
        errors.push(`Row ${i + 1}: Roll number "${rollStr}" is not a valid number.`);
        continue;
      }
      if (rolls.has(roll)) {
        errors.push(`Row ${i + 1}: Duplicate roll number ${roll} in file.`);
        continue;
      }
      if (attendanceStr && isNaN(attendance)) {
        errors.push(`Row ${i + 1}: Attendance "${attendanceStr}" is not a valid number.`);
        continue;
      }
      
      rolls.add(roll);
      results.push({ name, roll, attendance });
    }
    
    return { data: results, errors };
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Roll,Attendance\nJohn Doe,101,15\nJane Smith,102,12\nBob Johnson,103,0";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (parsedStudents.length === 0 || csvErrors.length > 0) return;
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/createstudents-bulk", {
        roomid,
        students: parsedStudents
      });

      toast.success(response.data.message || "Students imported successfully!", { 
        position: "top-right",
        theme: "dark",
      });
      setTrigger(false);
      setreload(!reload);
      
      // Reset bulk state
      setCsvFile(null);
      setParsedStudents([]);
      setCsvErrors([]);
    } catch (err) {
      const message = err.response?.data?.message || "Bulk upload failed";
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
      <div 
        style={{
          ...styles.card, 
          maxWidth: activeTab === 'single' ? '450px' : '650px',
          transition: "max-width 0.3s ease"
        }} 
        onClick={(e) => e.stopPropagation()}
      >
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
        <p style={styles.subtitle}>Add a new student or import bulk roster</p>

        {/* Tab Switcher */}
        <div style={styles.tabContainer}>
          <button 
            type="button"
            style={{
              ...styles.tab, 
              ...(activeTab === 'single' ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab('single')}
          >
            Single Student
          </button>
          <button 
            type="button"
            style={{
              ...styles.tab, 
              ...(activeTab === 'bulk' ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk CSV Import
          </button>
        </div>

        {activeTab === "single" ? (
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
        ) : (
          <div>
            {/* Guidelines Card */}
            <div style={styles.templateCard}>
              <div style={styles.templateTitle}>
                <span>CSV Template Guidelines</span>
                <button 
                  type="button" 
                  onClick={downloadTemplate} 
                  style={styles.templateLink}
                >
                  Download Sample CSV
                </button>
              </div>
              <p style={{ color: "#aaa", fontSize: "12px", margin: "0 0 8px 0", textAlign: "left" }}>
                Make sure your CSV file is formatted exactly as shown below:
              </p>
              <pre style={styles.templateCode}>
{`Name, Roll, Attendance
John Doe, 101, 15
Jane Smith, 102, 12`}
              </pre>
            </div>

            {/* Drag & Drop Area */}
            <div 
              style={{
                ...styles.dropzone,
                ...(dragOver ? styles.dropzoneHover : {})
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith('.csv')) {
                  processFile(file);
                } else {
                  toast.error("Please drop a valid .csv file", { theme: "dark" });
                }
              }}
              onClick={() => document.getElementById("csvFileInput").click()}
            >
              <input 
                id="csvFileInput"
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              
              {csvFile ? (
                <div style={styles.fileInfo}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>{csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)</span>
                </div>
              ) : (
                <div>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#3b82f6" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  <div style={styles.dropzoneText}>Drag & drop CSV file here, or click to browse</div>
                  <div style={styles.dropzoneSubtext}>Only CSV files are supported</div>
                </div>
              )}
            </div>

            {/* Error alerts */}
            {csvErrors.length > 0 && (
              <div style={styles.errorBox}>
                <div style={styles.errorTitle}>Validation Errors ({csvErrors.length})</div>
                {csvErrors.map((err, i) => (
                  <div key={i} style={styles.errorText}>• {err}</div>
                ))}
              </div>
            )}

            {/* Preview Table */}
            {parsedStudents.length > 0 && csvErrors.length === 0 && (
              <div>
                <div style={{ ...styles.templateTitle, marginBottom: "8px" }}>
                  <span>Roster Preview ({parsedStudents.length} students found)</span>
                </div>
                <div style={styles.previewContainer}>
                  <table style={styles.previewTable}>
                    <thead>
                      <tr>
                        <th style={styles.previewHeader}>Roll</th>
                        <th style={styles.previewHeader}>Name</th>
                        <th style={styles.previewHeader}>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedStudents.map((s, idx) => (
                        <tr key={idx} style={styles.previewRow}>
                          <td style={styles.previewCell}>{s.roll}</td>
                          <td style={styles.previewCell}>{s.name}</td>
                          <td style={styles.previewCell}>{s.attendance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={loading || parsedStudents.length === 0 || csvErrors.length > 0}
              onClick={handleBulkSubmit}
              style={{
                ...styles.submitBtn,
                ...(hoveredButton === 'bulk-submit' ? styles.submitBtnHover : {}),
                ...((loading || parsedStudents.length === 0 || csvErrors.length > 0) ? styles.submitBtnLoading : {}),
              }}
              onMouseEnter={() => setHoveredButton('bulk-submit')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  <span>Importing Students...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={styles.btnIcon}>
                    <path fill="currentColor" d="M9 1a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H1a1 1 0 110-2h7V2a1 1 0 011-1z" />
                  </svg>
                  <span>Import {parsedStudents.length > 0 ? parsedStudents.length : ""} Students</span>
                </>
              )}
            </button>
          </div>
        )}
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

  tabContainer: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "10px",
    padding: "4px",
    marginBottom: "25px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "#b3b3b3",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif",
  },

  activeTab: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
  },

  dropzone: {
    border: "2px dashed rgba(59, 130, 246, 0.4)",
    borderRadius: "12px",
    padding: "30px 20px",
    textAlign: "center",
    cursor: "pointer",
    background: "rgba(59, 130, 246, 0.02)",
    transition: "all 0.3s ease",
    marginBottom: "20px",
  },

  dropzoneHover: {
    borderColor: "#3b82f6",
    background: "rgba(59, 130, 246, 0.08)",
    transform: "scale(1.01)",
  },

  dropzoneText: {
    color: "#e0e0e0",
    fontSize: "14px",
    marginTop: "10px",
  },

  dropzoneSubtext: {
    color: "#888",
    fontSize: "12px",
    marginTop: "5px",
  },

  fileInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#3b82f6",
    fontWeight: "500",
    fontSize: "14px",
  },

  templateCard: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "20px",
    textAlign: "left",
  },

  templateTitle: {
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  templateLink: {
    color: "#3b82f6",
    fontSize: "12px",
    cursor: "pointer",
    textDecoration: "underline",
    background: "none",
    border: "none",
    padding: 0,
    fontWeight: "500",
  },

  templateCode: {
    fontFamily: "monospace",
    background: "rgba(0, 0, 0, 0.3)",
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#a9b7c6",
    fontSize: "12px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    border: "1px solid rgba(255, 255, 255, 0.03)",
  },

  previewContainer: {
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: "20px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  previewTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    color: "#e0e0e0",
  },

  previewHeader: {
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    padding: "10px",
    fontWeight: "600",
    textAlign: "left",
    position: "sticky",
    top: 0,
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },

  previewRow: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },

  previewCell: {
    padding: "10px",
    textAlign: "left",
  },

  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "20px",
    textAlign: "left",
    maxHeight: "150px",
    overflowY: "auto",
  },

  errorTitle: {
    color: "#ef4444",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "5px",
  },

  errorText: {
    color: "#fca5a5",
    fontSize: "12px",
    margin: "4px 0",
    paddingLeft: "10px",
    textAlign: "left",
  },
};