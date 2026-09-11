import { useState } from 'react';
import { toast } from 'react-toastify';
import { authApi } from '../api/auth';
import { getErrorMessage, isNotFoundError } from '../api/client';

/**
 * "Sign in with Google" flow: signs existing users in, and asks first-time
 * users to pick a role (and roll number) before creating their account.
 * @param {{ onAuthenticated: (session: { token: string, user: object }, isNewAccount: boolean) => void }} options
 */
export function useGoogleAuth({ onAuthenticated }) {
  const [pendingCredential, setPendingCredential] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCredential = async ({ credential }) => {
    setLoading(true);
    try {
      onAuthenticated(await authApi.googleLogin(credential), false);
    } catch (error) {
      if (isNotFoundError(error)) {
        setPendingCredential(credential);
      } else {
        toast.error(getErrorMessage(error, 'Google sign-in failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async ({ role, roll }) => {
    setLoading(true);
    try {
      const session = await authApi.googleRegister({ credential: pendingCredential, role, roll });
      setPendingCredential(null);
      onAuthenticated(session, true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return {
    needsRole: pendingCredential !== null,
    loading,
    handleCredential,
    completeRegistration,
    cancel: () => setPendingCredential(null),
  };
}
