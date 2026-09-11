import { useState } from 'react';

export default function BackButton({ onClick, children = 'Back' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      style={{ ...styles.button, ...(hovered ? styles.hover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 1.414L4.414 10l6.293 6.293A1 1 0 0110 18z"
        />
      </svg>
      <span>{children}</span>
    </button>
  );
}

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '30px',
    color: '#e0e0e0',
    fontWeight: '500',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },
  hover: {
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateX(-5px)',
  },
};
