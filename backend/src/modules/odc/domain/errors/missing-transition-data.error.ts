// Domain error for a transition invoked without its required data.
// The controller translates it to HTTP 400 (R4).
export class MissingTransitionDataError extends Error {
  constructor(action: string, missingFields: string[]) {
    super(
      `Action '${action}' requires the fields: ${missingFields.join(', ')}`,
    );
    this.name = 'MissingTransitionDataError';
  }
}
