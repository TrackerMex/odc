export class StoredFileNotFoundError extends Error {
  constructor() {
    super('The stored file was not found');
    this.name = 'StoredFileNotFoundError';
  }
}
