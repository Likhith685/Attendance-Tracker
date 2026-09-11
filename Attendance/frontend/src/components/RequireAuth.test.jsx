import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../context/auth-context';
import RequireAuth from './RequireAuth';

function renderAt(user) {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login() {}, logout() {} }}>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/" element={<p>Landing page</p>} />
          <Route path="/student-dashboard" element={<p>Student dashboard</p>} />
          <Route
            path="/home"
            element={
              <RequireAuth role="Teacher">
                <p>Teacher home</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('sends anonymous visitors to the landing page', () => {
    renderAt(null);
    expect(screen.getByText('Landing page')).toBeInTheDocument();
  });

  it('sends users with the wrong role to their own dashboard', () => {
    renderAt({ id: '2', name: 'Sam', role: 'Student', roll: 4 });
    expect(screen.getByText('Student dashboard')).toBeInTheDocument();
  });

  it('renders the page for the right role', () => {
    renderAt({ id: '1', name: 'Ada', role: 'Teacher', roll: null });
    expect(screen.getByText('Teacher home')).toBeInTheDocument();
  });
});
