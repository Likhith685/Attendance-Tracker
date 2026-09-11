import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { saveSession } from '../utils/storage';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

vi.mock('../api/auth', () => ({ authApi: { me: vi.fn() } }));
vi.mock('../api/client', () => ({ setUnauthorizedHandler: vi.fn(() => () => {}) }));

const teacher = { id: '1', name: 'Ada', email: 'ada@example.com', role: 'Teacher', roll: null };

function Probe() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="user">{user ? `${user.name} (${user.role})` : 'anonymous'}</p>
      <button type="button" onClick={() => login({ token: 't1', user: teacher })}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  vi.mocked(authApi.me).mockReset();
});

describe('AuthProvider', () => {
  it('logs in and out, persisting the session', async () => {
    renderProvider();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');

    act(() => screen.getByText('login').click());
    expect(screen.getByTestId('user')).toHaveTextContent('Ada (Teacher)');
    expect(localStorage.getItem('token')).toBe('t1');

    act(() => screen.getByText('logout').click());
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('restores a stored session and refreshes the profile', async () => {
    saveSession({ token: 'stored', user: { ...teacher, name: 'Old Name' } });
    vi.mocked(authApi.me).mockResolvedValue({ ...teacher, name: 'New Name' });

    renderProvider();
    expect(screen.getByTestId('user')).toHaveTextContent('Old Name');
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('New Name'));
  });

  it('clears legacy session data that has no profile', () => {
    localStorage.setItem('token', 'legacy');
    localStorage.setItem('role', 'Teacher');
    renderProvider();

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(localStorage.getItem('token')).toBeNull();
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('logs out when the API reports the session is no longer valid', () => {
    saveSession({ token: 'stored', user: teacher });
    vi.mocked(authApi.me).mockReturnValue(new Promise(() => {}));
    renderProvider();

    const handler = vi.mocked(setUnauthorizedHandler).mock.lastCall[0];
    act(() => handler());
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });
});
