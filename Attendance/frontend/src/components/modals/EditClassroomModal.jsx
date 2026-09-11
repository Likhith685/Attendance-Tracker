import { useState } from 'react';
import { toast } from 'react-toastify';
import { classroomsApi } from '../../api/classrooms';
import { getErrorMessage } from '../../api/client';
import { BookIcon, CheckIcon, LoadingDots, Spinner, TagIcon } from '../icons';
import Modal from '../Modal';
import { createModalFormStyles } from './modalFormStyles';

const styles = createModalFormStyles({ from: '#f59e0b', to: '#d97706' });

/** Mount this only while it is open so the form starts from the latest classroom values. */
export default function EditClassroomModal({ classroom, onClose, onSaved }) {
  const [cname, setCname] = useState(classroom.cname);
  const [ccode, setCcode] = useState(classroom.ccode);
  const [days, setDays] = useState(String(classroom.days));
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const updated = await classroomsApi.update(classroom.id, {
        cname,
        ccode,
        days: Number(days),
      });
      toast.success('Classroom updated successfully!');
      onSaved(updated);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the classroom.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="edit-classroom-title"
      accent="rgba(245, 158, 11, 0.3)"
    >
      <div style={styles.logoContainer}>
        <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true">
          <defs>
            <linearGradient id="editRoomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
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
          <path d="M48 22L52 18l4 4-4 4-4-4z" fill="url(#editRoomGradient)" />
          <path
            d="M40 30l8-8"
            stroke="url(#editRoomGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 id="edit-classroom-title" style={styles.title}>
        {loading ? <LoadingDots>Updating</LoadingDots> : 'Edit Classroom'}
      </h2>
      <p style={styles.subtitle}>Update classroom information</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="edit-classroom-name" style={styles.label}>
            <BookIcon style={styles.labelIcon} />
            Course Name
          </label>
          <input
            id="edit-classroom-name"
            type="text"
            required
            maxLength={100}
            autoFocus
            style={styles.input}
            value={cname}
            onChange={(event) => setCname(event.target.value)}
            placeholder="Enter course name"
            disabled={loading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="edit-classroom-code" style={styles.label}>
            <TagIcon style={styles.labelIcon} />
            Course Code
          </label>
          <input
            id="edit-classroom-code"
            type="text"
            required
            maxLength={30}
            style={styles.input}
            value={ccode}
            onChange={(event) => setCcode(event.target.value)}
            placeholder="Enter course code"
            disabled={loading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="edit-classroom-days" style={styles.label}>
            <BookIcon style={styles.labelIcon} />
            Total Days
          </label>
          <input
            id="edit-classroom-days"
            type="number"
            inputMode="numeric"
            required
            min="0"
            step="1"
            style={styles.input}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            placeholder="Enter total days"
            disabled={loading}
            aria-describedby="edit-classroom-days-hint"
          />
          <p id="edit-classroom-days-hint" style={{ ...styles.hint, color: '#8c8c8c' }}>
            Increases automatically each time attendance is marked for a new date.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitBtn,
            ...(hovered ? styles.submitBtnHover : {}),
            ...(loading ? styles.submitBtnLoading : {}),
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {loading ? (
            <>
              <Spinner />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <CheckIcon />
              <span>Update Classroom</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
