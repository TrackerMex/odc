// Domain error for an ODC id that does not exist.
// The controller translates it to HTTP 404.
export class OdcNotFoundError extends Error {
  constructor(odcId: string) {
    super(`Purchase order ${odcId} not found`);
    this.name = 'OdcNotFoundError';
  }
}
