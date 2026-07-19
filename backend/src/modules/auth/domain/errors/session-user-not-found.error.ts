// The sub of a valid JWT no longer matches any user: the session is
// worthless and must be treated as unauthenticated (R10).
export class SessionUserNotFoundError extends Error {
  constructor() {
    super('Session user no longer exists');
    this.name = 'SessionUserNotFoundError';
  }
}
