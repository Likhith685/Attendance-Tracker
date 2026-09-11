import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: rendered in a portal, closes on Escape or backdrop
 * click, keeps keyboard focus inside while open and restores it afterwards.
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  accent = 'rgba(229, 9, 20, 0.3)',
  maxWidth = '450px',
  padding = '40px 35px',
  children,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.contains(document.activeElement)) dialog.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...dialog.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      style={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={{
          ...styles.card,
          maxWidth,
          padding,
          boxShadow: `0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px ${accent}`,
        }}
      >
        <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    zIndex: 1100,
    overflowY: 'auto',
    padding: '20px',
    animation: 'fadeIn 0.3s ease-out',
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    borderRadius: '20px',
    width: '90%',
    position: 'relative',
    margin: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    color: '#fff',
    transition: 'max-width 0.3s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.3s ease',
    zIndex: 1,
  },
};
