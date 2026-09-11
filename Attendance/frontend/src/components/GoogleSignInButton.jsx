import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { GOOGLE_CLIENT_ID } from '../config';

/** Divider plus Google's button. Renders nothing when Google sign-in is not configured. */
export default function GoogleSignInButton({ text = 'signin_with', onCredential }) {
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <div style={styles.divider} role="separator">
        <span style={styles.line} />
        <span style={styles.dividerText}>or</span>
        <span style={styles.line} />
      </div>
      <div style={styles.wrapper}>
        <GoogleLogin
          onSuccess={onCredential}
          onError={() => toast.error('Google sign-in was unsuccessful. Please try again.')}
          theme="filled_blue"
          shape="rectangular"
          text={text}
          size="large"
          width="300"
        />
      </div>
    </>
  );
}

const styles = {
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '24px 0 16px',
  },
  line: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#8c8c8c',
    fontSize: '13px',
  },
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
    width: '100%',
  },
};
