import { useState } from 'react';
import { EyeIcon } from './icons';

/** Password field with a show/hide toggle. */
export default function PasswordInput({ style, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={styles.wrapper}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        style={{ ...style, paddingRight: '48px' }}
      />
      <button
        type="button"
        style={styles.toggle}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
      >
        <EyeIcon crossed={visible} />
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  toggle: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#8c8c8c',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
