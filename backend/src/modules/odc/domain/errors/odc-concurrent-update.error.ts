export class OdcConcurrentUpdateError extends Error {
  constructor() {
    super(
      'La ODC cambió durante esta operación. Recarga y vuelve a intentarlo.',
    );
    this.name = 'OdcConcurrentUpdateError';
  }
}
