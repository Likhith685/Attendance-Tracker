import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classroomsApi } from '../api/classrooms';
import { getErrorMessage, isCancelledRequest } from '../api/client';
import PageLoader from '../components/PageLoader';
import { ArrowRightIcon } from '../components/icons';
import { ROUTES } from '../utils/routes';

const truncate = (text, length = 20) =>
  text.length > length ? `${text.substring(0, length - 3)}...` : text;

export default function TeacherHome() {
  const [classrooms, setClassrooms] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  const fetchClassrooms = useCallback(
    (signal) =>
      classroomsApi.list({ signal }).then(
        (rooms) => {
          setClassrooms(rooms);
          setStatus('ready');
        },
        (err) => {
          if (isCancelledRequest(err)) return;
          setError(getErrorMessage(err, 'Could not load your classrooms.'));
          setStatus('error');
        },
      ),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchClassrooms(controller.signal);
    return () => controller.abort();
  }, [fetchClassrooms]);

  if (status === 'loading') return <PageLoader message="Loading your classrooms..." />;

  return (
    <div className="home-container" style={styles.container}>
      <div style={styles.header}>
        <h1 className="home-title" style={styles.title}>
          Your Classrooms
        </h1>
        <div style={styles.titleUnderline} aria-hidden="true" />
      </div>

      {status === 'error' && (
        <div role="alert" style={styles.messageCard}>
          <p style={styles.messageTitle}>{error}</p>
          <button
            type="button"
            style={styles.retryButton}
            onClick={() => {
              setStatus('loading');
              fetchClassrooms();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && classrooms.length === 0 && (
        <div style={styles.messageCard}>
          <p style={styles.messageTitle}>You haven&apos;t created any classrooms yet.</p>
          <p style={styles.messageText}>
            Use <strong>Add Classroom</strong> in the top bar to create your first one.
          </p>
        </div>
      )}

      <div className="home-grid" style={styles.grid}>
        {classrooms.map((room, index) => {
          const hovered = hoveredCard === room.id;
          return (
            <article
              key={room.id}
              style={{
                ...styles.card,
                ...(hovered ? styles.cardHover : {}),
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`,
              }}
              onMouseEnter={() => setHoveredCard(room.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ ...styles.cardGlow, opacity: hovered ? 1 : 0 }} aria-hidden="true" />

              <div style={styles.cardContent}>
                <div style={styles.codeWrapper}>
                  <p style={styles.code} title={room.ccode}>
                    {truncate(room.ccode)}
                  </p>
                  {room.checkIn.active && <span style={styles.liveBadge}>LIVE</span>}
                </div>

                <h2 style={styles.name} title={room.cname}>
                  {truncate(room.cname, 30)}
                </h2>

                <div style={styles.stats}>
                  <span style={styles.stat}>Strength: {room.strength}</span>
                  <span style={styles.stat}>Sessions: {room.days}</span>
                </div>

                <Link
                  to={ROUTES.classroom(room.id)}
                  style={{ ...styles.enterBtn, ...(hovered ? styles.enterBtnHover : {}) }}
                >
                  <span>Enter Room</span>
                  <ArrowRightIcon />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '60px 40px',
    fontFamily: "'Poppins', sans-serif",
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  header: { textAlign: 'center', marginBottom: '60px', position: 'relative', zIndex: 2 },
  title: {
    fontSize: '56px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #e50914 0%, #ff6b6b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '20px',
    letterSpacing: '-1px',
    filter: 'drop-shadow(0 0 40px rgba(229, 9, 20, 0.3))',
  },
  titleUnderline: {
    width: '120px',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #e50914, transparent)',
    margin: '0 auto',
    borderRadius: '2px',
  },
  messageCard: {
    maxWidth: '560px',
    margin: '0 auto 40px',
    padding: '40px 30px',
    textAlign: 'center',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  messageTitle: { color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' },
  messageText: { color: '#8c8c8c', fontSize: '14px' },
  retryButton: {
    marginTop: '16px',
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #e50914 0%, #b00710 100%)',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
  },
  card: {
    background: 'linear-gradient(145deg, #1f1f1f 0%, #141414 100%)',
    borderRadius: '16px',
    padding: '32px 24px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardHover: {
    transform: 'translateY(-12px) scale(1.03)',
    boxShadow: '0 20px 50px rgba(229, 9, 20, 0.25), 0 0 30px rgba(6, 182, 212, 0.25)',
    border: '1px solid rgba(6, 182, 212, 0.5)',
  },
  cardGlow: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(229, 9, 20, 0.2) 0%, transparent 70%)',
    transition: 'opacity 0.4s ease',
    pointerEvents: 'none',
  },
  cardContent: { position: 'relative', zIndex: 1 },
  codeWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '16px',
  },
  code: {
    fontSize: '40px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #e50914 0%, #ff4757 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '2px',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  liveBadge: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: '1px',
    flexShrink: 0,
  },
  name: {
    fontSize: '22px',
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: '0.5px',
    margin: '0 0 16px 0',
    lineHeight: '1.4',
  },
  stats: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' },
  stat: { fontSize: '14px', color: '#8c8c8c', letterSpacing: '0.3px' },
  enterBtn: {
    backgroundColor: '#e50914',
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '15px',
    letterSpacing: '0.5px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    boxShadow: '0 4px 20px rgba(229, 9, 20, 0.3)',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  enterBtnHover: {
    backgroundColor: '#f40612',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(229, 9, 20, 0.5)',
  },
};
