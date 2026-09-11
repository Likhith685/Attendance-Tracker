export default function PageLoader({ message = 'Loading...', color = '#e50914', compact = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ ...styles.container, minHeight: compact ? '200px' : '100vh' }}
    >
      <div style={styles.loader} aria-hidden="true">
        {['-0.45s', '-0.3s', '-0.15s'].map((delay) => (
          <div
            key={delay}
            style={{ ...styles.ring, borderTopColor: color, animationDelay: delay }}
          />
        ))}
      </div>
      <p style={styles.text}>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    fontFamily: "'Poppins', sans-serif",
  },
  loader: {
    position: 'relative',
    width: '64px',
    height: '64px',
  },
  ring: {
    position: 'absolute',
    inset: 0,
    border: '4px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
  },
  text: {
    marginTop: '24px',
    color: '#b3b3b3',
    fontSize: '16px',
    fontWeight: '500',
    letterSpacing: '0.5px',
  },
};
