import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { clearSession, loadSession, saveSession, saveUser } from '../utils/storage';
import { AuthContext } from './auth-context';

function readInitialUser() {
  const session = loadSession();
  if (!session) clearSession(); // drop incomplete or legacy session data
  return session?.user ?? null;
}

/**
 * Holds the signed-in user. The cached profile is used immediately and then
 * refreshed from the API; an expired or revoked token logs the user out.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);

  const login = useCallback((session) => {
    saveSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  useEffect(() => {
    if (!loadSession()) return undefined;

    const controller = new AbortController();
    authApi
      .me({ signal: controller.signal })
      .then((freshUser) => {
        saveUser(freshUser);
        setUser(freshUser);
      })
      // 401s are handled by the API client; keep the cached profile on network errors.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
