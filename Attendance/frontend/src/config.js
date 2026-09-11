const env = import.meta.env;

/** Backend origin without a trailing slash; API routes live under `${API_BASE_URL}/api`. */
export const API_BASE_URL = (env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

/** Google OAuth client id. Google sign-in is hidden when it is not configured. */
export const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '';
