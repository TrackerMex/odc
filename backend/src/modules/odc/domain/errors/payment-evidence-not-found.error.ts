// Domain error for "payment evidence not uploaded yet" (T8 not reached).
// Not a transition rule: a related-resource-not-found condition (R6).
// The controller translates it to HTTP 404.
export class PaymentEvidenceNotFoundError extends Error {
  constructor(odcId: string) {
    super(`Purchase order ${odcId} has no payment evidence uploaded`);
    this.name = 'PaymentEvidenceNotFoundError';
  }
}
