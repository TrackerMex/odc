export class InvalidOdcInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOdcInputError';
  }
}
