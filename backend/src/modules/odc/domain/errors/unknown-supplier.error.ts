// Domain error for a supplier string that does not match any name in the
// suppliers catalog. The controller translates it to HTTP 400.
export class UnknownSupplierError extends Error {
  constructor(supplier: string) {
    super(`Unknown supplier: ${supplier}`);
    this.name = 'UnknownSupplierError';
  }
}
