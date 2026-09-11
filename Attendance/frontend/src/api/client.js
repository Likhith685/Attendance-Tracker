import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // Generous because free-tier hosts can take a while to wake up.
  timeout: 60_000,
});

let unauthorizedHandler = null;

/** Registers the callback run when an authenticated request is rejected with 401. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && sentToken) unauthorizedHandler?.();
    return Promise.reject(error);
  },
);

/** Extracts a user-friendly message from an API error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.response?.data?.message;
  if (message) return message;
  if (error?.code === 'ECONNABORTED')
    return 'The server took too long to respond. Please try again.';
  if (error?.request && !error.response) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  return fallback;
}

export const isNotFoundError = (error) => error?.response?.status === 404;

export const isCancelledRequest = (error) => axios.isCancel(error);
