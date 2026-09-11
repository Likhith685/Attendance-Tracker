import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { classroomsApi } from '../../api/classrooms';
import { getErrorMessage } from '../../api/client';
import { CSV_TEMPLATE, isCsvFile, parseStudentCsv } from '../../utils/csv';
import { CheckIcon, IdCardIcon, LoadingDots, PlusIcon, Spinner, UserIcon } from '../icons';
import Modal from '../Modal';
import { createModalFormStyles } from './modalFormStyles';

const formStyles = createModalFormStyles({ from: '#3b82f6', to: '#2563eb' });
const MAX_FILE_BYTES = 1024 * 1024;

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'student_template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function AddStudentModal({ open, onClose, classroomId, onAdded }) {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(null);

  // Single student
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [attendance, setAttendance] = useState('');

  // Bulk CSV import
  const fileInputRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const resetBulk = () => {
    setCsvFile(null);
    setParsedStudents([]);
    setCsvErrors([]);
  };

  const processFile = async (file) => {
    if (!isCsvFile(file)) {
      toast.error('Please choose a .csv file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('The CSV file is too large (maximum 1 MB).');
      return;
    }
    setCsvFile(file);
    try {
      const { students, errors } = parseStudentCsv(await file.text());
      setParsedStudents(students);
      setCsvErrors(errors);
    } catch {
      setParsedStudents([]);
      setCsvErrors(['Failed to read the CSV file.']);
    }
  };

  const handleSingleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await classroomsApi.addStudent(classroomId, {
        name,
        roll: Number(roll),
        attendance: attendance === '' ? 0 : Number(attendance),
      });
      toast.success('Student added successfully!');
      setName('');
      setRoll('');
      setAttendance('');
      onAdded();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add the student.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedStudents.length === 0 || csvErrors.length > 0) return;
    setLoading(true);
    try {
      const result = await classroomsApi.importStudents(classroomId, parsedStudents);
      toast.success(result.message || 'Students imported successfully!');
      resetBulk();
      onAdded();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Bulk import failed.'));
    } finally {
      setLoading(false);
    }
  };

  const bulkDisabled = loading || parsedStudents.length === 0 || csvErrors.length > 0;
  const submitStyle = (key, disabled) => ({
    ...formStyles.submitBtn,
    ...(hovered === key && !disabled ? formStyles.submitBtnHover : {}),
    ...(disabled ? formStyles.submitBtnLoading : {}),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="add-student-title"
      accent="rgba(59, 130, 246, 0.3)"
      maxWidth={activeTab === 'single' ? '450px' : '650px'}
    >
      <div style={formStyles.logoContainer}>
        <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true">
          <defs>
            <linearGradient id="addStudentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
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
        </svg>
      </div>

      <h2 id="add-student-title" style={formStyles.title}>
        {loading ? <LoadingDots>Adding Students</LoadingDots> : 'Add Students'}
      </h2>
      <p style={formStyles.subtitle}>Add a single student or import a roster from CSV</p>

      <div role="tablist" aria-label="Add students" style={styles.tabContainer}>
        {[
          ['single', 'Single Student'],
          ['bulk', 'Bulk CSV Import'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            style={{ ...styles.tab, ...(activeTab === key ? styles.activeTab : {}) }}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'single' ? (
        <form onSubmit={handleSingleSubmit} style={formStyles.form}>
          <div style={formStyles.inputGroup}>
            <label htmlFor="student-name" style={formStyles.label}>
              <UserIcon style={formStyles.labelIcon} />
              Student Name
            </label>
            <input
              id="student-name"
              type="text"
              placeholder="Enter the student's full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={100}
              autoFocus
              style={formStyles.input}
              disabled={loading}
            />
          </div>

          <div style={formStyles.inputGroup}>
            <label htmlFor="student-roll" style={formStyles.label}>
              <IdCardIcon style={formStyles.labelIcon} />
              Roll Number
            </label>
            <input
              id="student-roll"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder="Enter roll number"
              value={roll}
              onChange={(event) => setRoll(event.target.value)}
              required
              style={formStyles.input}
              disabled={loading}
            />
          </div>

          <div style={formStyles.inputGroup}>
            <label htmlFor="student-attendance" style={formStyles.label}>
              <CheckIcon size={16} style={formStyles.labelIcon} />
              Current Attendance (optional)
            </label>
            <input
              id="student-attendance"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="Sessions already attended, e.g. 0"
              value={attendance}
              onChange={(event) => setAttendance(event.target.value)}
              style={formStyles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={submitStyle('single', loading)}
            onMouseEnter={() => setHovered('single')}
            onMouseLeave={() => setHovered(null)}
          >
            {loading ? (
              <>
                <Spinner />
                <span>Adding Student...</span>
              </>
            ) : (
              <>
                <PlusIcon />
                <span>Add Student</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div>
          <div style={styles.templateCard}>
            <div style={styles.templateTitle}>
              <span>CSV Template Guidelines</span>
              <button type="button" onClick={downloadTemplate} style={styles.templateLink}>
                Download Sample CSV
              </button>
            </div>
            <p style={styles.templateText}>
              Use the columns Name, Roll and (optionally) Attendance, for example:
            </p>
            <pre style={styles.templateCode}>
              {`Name, Roll, Attendance
John Doe, 101, 15
"Smith, Jane", 102, 12`}
            </pre>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a CSV file to import"
            style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneHover : {}) }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              processFile(event.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                processFile(event.target.files[0]);
                event.target.value = ''; // allow choosing the same file again
              }}
              hidden
            />

            {csvFile ? (
              <div style={styles.fileInfo}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>
                  {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            ) : (
              <div>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <div style={styles.dropzoneText}>
                  Drag &amp; drop a CSV file here, or click to browse
                </div>
                <div style={styles.dropzoneSubtext}>Only .csv files up to 1 MB are supported</div>
              </div>
            )}
          </div>

          {csvErrors.length > 0 && (
            <div role="alert" style={styles.errorBox}>
              <div style={styles.errorTitle}>Validation Errors ({csvErrors.length})</div>
              <ul style={styles.errorList}>
                {csvErrors.map((error) => (
                  <li key={error} style={styles.errorText}>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedStudents.length > 0 && csvErrors.length === 0 && (
            <div>
              <div style={{ ...styles.templateTitle, marginBottom: '8px' }}>
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
                    {parsedStudents.map((student) => (
                      <tr key={student.roll} style={styles.previewRow}>
                        <td style={styles.previewCell}>{student.roll}</td>
                        <td style={styles.previewCell}>{student.name}</td>
                        <td style={styles.previewCell}>{student.attendance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={bulkDisabled}
            onClick={handleBulkSubmit}
            style={submitStyle('bulk', bulkDisabled)}
            onMouseEnter={() => setHovered('bulk')}
            onMouseLeave={() => setHovered(null)}
          >
            {loading ? (
              <>
                <Spinner />
                <span>Importing Students...</span>
              </>
            ) : (
              <>
                <PlusIcon />
                <span>Import {parsedStudents.length || ''} Students</span>
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}

const styles = {
  tabContainer: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '25px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#b3b3b3',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },
  activeTab: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
  },
  dropzone: {
    border: '2px dashed rgba(59, 130, 246, 0.4)',
    borderRadius: '12px',
    padding: '30px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: 'rgba(59, 130, 246, 0.02)',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
  },
  dropzoneHover: {
    borderColor: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.08)',
    transform: 'scale(1.01)',
  },
  dropzoneText: { color: '#e0e0e0', fontSize: '14px', marginTop: '10px' },
  dropzoneSubtext: { color: '#888', fontSize: '12px', marginTop: '5px' },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#3b82f6',
    fontWeight: '500',
    fontSize: '14px',
    wordBreak: 'break-all',
  },
  templateCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
  },
  templateTitle: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  templateText: { color: '#aaa', fontSize: '12px', margin: '0 0 8px 0' },
  templateLink: {
    color: '#3b82f6',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    padding: 0,
    fontWeight: '500',
  },
  templateCode: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#a9b7c6',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    margin: 0,
  },
  previewContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginBottom: '20px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  previewTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#e0e0e0' },
  previewHeader: {
    background: '#1f1f1f',
    color: '#fff',
    padding: '10px',
    fontWeight: '600',
    textAlign: 'left',
    position: 'sticky',
    top: 0,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  previewRow: { borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
  previewCell: { padding: '10px', textAlign: 'left' },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  errorTitle: { color: '#ef4444', fontSize: '13px', fontWeight: '600', marginBottom: '5px' },
  errorList: { margin: 0, paddingLeft: '18px' },
  errorText: { color: '#fca5a5', fontSize: '12px', margin: '4px 0' },
};
