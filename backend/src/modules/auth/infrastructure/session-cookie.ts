import { CookieOptions } from 'express';

export const SESSION_COOKIE_NAME = 'odc_session';

// Aligned with the 8h JWT expiration (R6)
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export function sessionCookieOptions(
  env: NodeJS.ProcessEnv = process.env,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  };
}
