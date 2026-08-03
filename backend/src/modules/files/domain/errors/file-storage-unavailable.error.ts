export class FileStorageUnavailableError extends Error {
  constructor() {
    super('The file storage service is temporarily unavailable');
    this.name = 'FileStorageUnavailableError';
  }
}
