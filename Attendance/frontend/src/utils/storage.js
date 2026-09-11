const TOKEN_KEY = 'token';
const USER_KEY = 'user';
// Keys written by earlier versions of the app.
const LEGACY_KEYS = ['role', 'roll', 'user_info'];

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** @returns {{ token: string, user: object } | null} */
export function loadSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
    return token && user?.id ? { token, user } : null;
  } catch {
    return null;
  }
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  [TOKEN_KEY, USER_KEY, ...LEGACY_KEYS].forEach((key) => localStorage.removeItem(key));
}
