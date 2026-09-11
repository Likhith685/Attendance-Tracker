import { useState } from 'react';
import { toast } from 'react-toastify';
import { classroomsApi } from '../../api/classrooms';
import { getErrorMessage } from '../../api/client';
import { BookIcon, LoadingDots, PlusIcon, Spinner, TagIcon } from '../icons';
import Modal from '../Modal';
import { createModalFormStyles } from './modalFormStyles';

const styles = createModalFormStyles({ from: '#10b981', to: '#059669' });

export default function AddClassroomModal({ open, onClose, onCreated }) {
  const [cname, setCname] = useState('');
  const [ccode, setCcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const classroom = await classroomsApi.create({ cname, ccode });
      toast.success('Classroom created successfully!');
      setCname('');
      setCcode('');
      onCreated(classroom);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the classroom.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="add-classroom-title"
      accent="rgba(16, 185, 129, 0.3)"
    >
      <div style={styles.logoContainer}>
        <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true">
          <defs>
            <linearGradient id="addClassroomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="35" cy="35" r="33" fill="url(#addClassroomGradient)" opacity="0.2" />
          <path
            d="M35 15v40M15 35h40"
            stroke="url(#addClassroomGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            cx="35"
            cy="35"
            r="30"
            stroke="url(#addClassroomGradient)"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      <h2 id="add-classroom-title" style={styles.title}>
        {loading ? <LoadingDots>Creating</LoadingDots> : 'Add Classroom'}
      </h2>
      <p style={styles.subtitle}>Create a new classroom to manage attendance</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="classroom-name" style={styles.label}>
            <BookIcon style={styles.labelIcon} />
            Classroom Name
          </label>
          <input
            id="classroom-name"
            type="text"
            placeholder="e.g., Computer Science 101"
            value={cname}
            onChange={(event) => setCname(event.target.value)}
            required
            maxLength={100}
            autoFocus
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="classroom-code" style={styles.label}>
            <TagIcon style={styles.labelIcon} />
            Course Code
          </label>
          <input
            id="classroom-code"
            type="text"
            placeholder="e.g., CS101"
            value={ccode}
            onChange={(event) => setCcode(event.target.value)}
            required
            maxLength={30}
            style={styles.input}
            disabled={loading}
          />
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
              <span>Creating...</span>
            </>
          ) : (
            <>
              <PlusIcon />
              <span>Create Classroom</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
