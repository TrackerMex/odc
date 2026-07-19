// Same error for unknown email and wrong password: the message must not
// reveal which of the two failed (R7).
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}
