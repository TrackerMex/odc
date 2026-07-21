// Domain error for "invoice not uploaded yet" (T9 not reached).
// Not a transition rule: a related-resource-not-found condition (R6).
// The controller translates it to HTTP 404.
export class InvoiceNotFoundError extends Error {
  constructor(odcId: string) {
    super(`Purchase order ${odcId} has no invoice uploaded`);
    this.name = 'InvoiceNotFoundError';
  }
}
