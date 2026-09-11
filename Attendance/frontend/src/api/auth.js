import { apiClient } from './client';

/** Each call resolves to `{ token, user }` except `me`, which resolves to the user. */
export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((res) => res.data),

  login: (credentials) => apiClient.post('/auth/login', credentials).then((res) => res.data),

  googleLogin: (credential) =>
    apiClient.post('/auth/google', { credential }).then((res) => res.data),

  googleRegister: (payload) =>
    apiClient.post('/auth/google/register', payload).then((res) => res.data),

  me: (options) => apiClient.get('/auth/me', options).then((res) => res.data.user),
};
