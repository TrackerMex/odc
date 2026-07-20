// Domain error for an action that is not valid from the current status.
// The controller translates it to HTTP 409 (R4).
export class InvalidStatusTransitionError extends Error {
  constructor(action: string, currentStatus: string) {
    super(`Action '${action}' is not valid from status ${currentStatus}`);
    this.name = 'InvalidStatusTransitionError';
  }
}
