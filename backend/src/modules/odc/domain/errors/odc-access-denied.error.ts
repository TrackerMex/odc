// Domain error for the fine-grained "only the creator" rule (T2/T10, PATCH,
// BORRADOR visibility). The controller translates it to HTTP 403.
export class OdcAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OdcAccessDeniedError';
  }
}
