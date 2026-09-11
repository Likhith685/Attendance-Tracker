import { createContext } from 'react';

/** @type {import('react').Context<null | {
 *   user: { id: string, name: string, email: string, role: 'Teacher' | 'Student', roll: number | null } | null,
 *   isAuthenticated: boolean,
 *   login: (session: { token: string, user: object }) => void,
 *   logout: () => void,
 * }>} */
export const AuthContext = createContext(null);
