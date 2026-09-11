import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../../api/auth';
import LoginModal from './LoginModal';

vi.mock('../../api/auth', () => ({ authApi: { login: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const session = {
  token: 'jwt',
  user: { id: '1', name: 'Ada', email: 'ada@example.com', role: 'Teacher', roll: null },
};

function renderModal(props = {}) {
  const handlers = { onClose: vi.fn(), onAuthenticated: vi.fn(), onSwitchToSignup: vi.fn() };
  render(<LoginModal open {...handlers} {...props} />);
  return handlers;
}

async function submit(user, email, password) {
  await user.type(screen.getByLabelText('Email Address'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: /^login$/i }));
}

beforeEach(() => {
  vi.mocked(authApi.login).mockReset();
});

describe('LoginModal', () => {
  it('renders an accessible dialog', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Welcome Back' })).toBeInTheDocument();
  });

  it('signs the user in with their credentials', async () => {
    vi.mocked(authApi.login).mockResolvedValue(session);
    const user = userEvent.setup();
    const { onAuthenticated } = renderModal();

    await submit(user, 'ada@example.com', 'password123');

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123',
    });
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(session));
  });

  it('shows the error returned by the API', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email or password.' } },
    });
    const user = userEvent.setup();
    const { onAuthenticated } = renderModal();

    await submit(user, 'ada@example.com', 'wrong-password');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid email or password.'));
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('closes on Escape and switches to sign up', async () => {
    const user = userEvent.setup();
    const { onClose, onSwitchToSignup } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(onSwitchToSignup).toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
