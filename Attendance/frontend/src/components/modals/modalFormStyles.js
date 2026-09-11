const hexToRgb = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
};

/**
 * Shared styles for form dialogs (login, sign-up, classroom and student forms).
 * @param {{ from: string, to: string, compact?: boolean }} theme accent gradient colours (hex)
 */
export function createModalFormStyles({ from, to, compact = false }) {
  const rgb = hexToRgb(from);
  const arrow = encodeURIComponent(from);

  return {
    logoContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: compact ? '10px' : '25px',
      filter: `drop-shadow(0 0 20px rgba(${rgb}, 0.4))`,
    },
    title: {
      textAlign: 'center',
      marginBottom: compact ? '5px' : '10px',
      fontSize: compact ? '26px' : '32px',
      fontWeight: '700',
      background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      textAlign: 'center',
      color: '#b3b3b3',
      fontSize: compact ? '13px' : '14px',
      marginBottom: compact ? '15px' : '35px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? '12px' : '20px',
    },
    row: {
      display: 'flex',
      gap: '12px',
      width: '100%',
      flexWrap: 'wrap',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? '5px' : '8px',
      flex: '1 1 150px',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '500',
      color: '#e0e0e0',
      fontSize: compact ? '13px' : '14px',
      letterSpacing: '0.3px',
    },
    labelIcon: { opacity: 0.7 },
    input: {
      padding: compact ? '10px 12px' : '14px 16px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: compact ? '14px' : '15px',
      outline: 'none',
      width: '100%',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      transition: 'all 0.3s ease',
      fontFamily: "'Poppins', sans-serif",
    },
    select: {
      padding: '10px 40px 10px 12px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '14px',
      outline: 'none',
      width: '100%',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${arrow}' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      fontFamily: "'Poppins', sans-serif",
    },
    selectOption: { background: '#1f1f1f', color: '#fff' },
    hint: {
      fontSize: '11px',
      color: '#f59e0b',
      marginTop: '4px',
      lineHeight: '1.4',
      opacity: 0.85,
    },
    submitBtn: {
      marginTop: '10px',
      padding: '16px 32px',
      width: '100%',
      background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      color: '#fff',
      fontWeight: '600',
      fontSize: '16px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 8px 25px rgba(${rgb}, 0.4)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      letterSpacing: '0.5px',
      fontFamily: "'Poppins', sans-serif",
    },
    submitBtnHover: {
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 35px rgba(${rgb}, 0.6)`,
    },
    submitBtnLoading: { opacity: 0.8, cursor: 'not-allowed' },
    footerText: {
      textAlign: 'center',
      color: '#b3b3b3',
      fontSize: '14px',
      margin: 0,
    },
    linkButton: {
      color: from,
      fontWeight: '600',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      padding: 0,
      fontSize: 'inherit',
      fontFamily: 'inherit',
    },
  };
}
