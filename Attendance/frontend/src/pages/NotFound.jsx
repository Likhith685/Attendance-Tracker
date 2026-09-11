import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { homePathFor, ROUTES } from '../utils/routes';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.code}>404</p>
        <h1 style={styles.title}>Page not found</h1>
        <p style={styles.text}>
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to={user ? homePathFor(user.role) : ROUTES.landing} style={styles.link}>
          {user ? 'Go to your dashboard' : 'Back to home'}
        </Link>
      </div>
    </main>
  );
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
    padding: '48px 30px',
    borderRadius: '20px',
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6)',
  },
  code: {
    fontSize: '64px',
    fontWeight: '800',
    lineHeight: 1,
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '10px' },
  text: { color: '#b3b3b3', fontSize: '15px', marginBottom: '28px' },
  link: {
    display: 'inline-block',
    padding: '12px 28px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    color: '#fff',
    fontWeight: '600',
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.3)',
  },
};
