import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let client;

/** Verifies a Google Identity Services ID token issued for this app's client id. */
export async function verifyGoogleCredential(credential) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw ApiError.serviceUnavailable('Google sign-in is not configured on this server.');
  }
  client ??= new OAuth2Client(env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google credential. Please try signing in again.');
  }

  if (!payload?.email || !payload.email_verified) {
    throw ApiError.unauthorized('Your Google account email address is not verified.');
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split('@')[0],
  };
}
