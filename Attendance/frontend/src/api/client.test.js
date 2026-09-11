import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, getErrorMessage, setUnauthorizedHandler } from './client';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

function respondWith(status, data = {}) {
  apiClient.defaults.adapter = async (config) => {
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, response);
    }
    return response;
  };
}

describe('apiClient', () => {
  it('sends the stored token as a bearer token', async () => {
    localStorage.setItem('token', 'my-token');
    let sentHeaders;
    apiClient.defaults.adapter = async (config) => {
      sentHeaders = config.headers;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    await apiClient.get('/anything');
    expect(sentHeaders.Authorization).toBe('Bearer my-token');
  });

  it('runs the unauthorized handler when an authenticated request gets a 401', async () => {
    const handler = vi.fn();
    const unregister = setUnauthorizedHandler(handler);
    respondWith(401, { message: 'Session expired' });

    localStorage.setItem('token', 'expired');
    await expect(apiClient.get('/me')).rejects.toBeInstanceOf(AxiosError);
    expect(handler).toHaveBeenCalledTimes(1);

    // A 401 without a token (e.g. wrong password at login) must not log anyone out.
    localStorage.removeItem('token');
    await expect(apiClient.post('/auth/login')).rejects.toBeInstanceOf(AxiosError);
    expect(handler).toHaveBeenCalledTimes(1);

    unregister();
  });
});

describe('getErrorMessage', () => {
  it('prefers the message returned by the API', () => {
    expect(getErrorMessage({ response: { data: { message: 'Roll taken' } } })).toBe('Roll taken');
  });

  it('describes network failures and timeouts', () => {
    expect(getErrorMessage({ request: {}, response: undefined })).toMatch(/unable to reach/i);
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toMatch(/too long/i);
  });

  it('falls back to the provided message', () => {
    expect(getErrorMessage(new Error('boom'), 'Could not save')).toBe('Could not save');
  });
});
