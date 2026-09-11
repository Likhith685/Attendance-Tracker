import { Component } from 'react';

/** Catches rendering errors (including failed lazy-loaded chunks) and offers a reload. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.text}>
            An unexpected error occurred. Reloading the page usually fixes it.
          </p>
          <button type="button" style={styles.button} onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
    padding: '40px 30px',
    borderRadius: '20px',
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    border: '1px solid rgba(229, 9, 20, 0.3)',
  },
  title: { fontSize: '26px', fontWeight: '700', color: '#e50914', marginBottom: '12px' },
  text: { color: '#b3b3b3', fontSize: '15px', marginBottom: '24px' },
  button: {
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
  },
};
