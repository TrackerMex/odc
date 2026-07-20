// Domain error for a transition attempted with an unauthorized role.
// The controller translates it to HTTP 403 (R4).
export class InvalidRoleTransitionError extends Error {
  constructor(action: string, role: string) {
    super(`Role ${role} is not allowed to perform '${action}'`);
    this.name = 'InvalidRoleTransitionError';
  }
}
