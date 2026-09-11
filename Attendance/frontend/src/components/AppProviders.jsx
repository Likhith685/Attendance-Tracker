import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../config';
import { AuthProvider } from '../context/AuthProvider';

/** App-wide context providers. */
export default function AppProviders({ children }) {
  const app = <AuthProvider>{children}</AuthProvider>;
  // Google sign-in is optional; skip loading Google's script when it is not configured.
  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
  ) : (
    app
  );
}
