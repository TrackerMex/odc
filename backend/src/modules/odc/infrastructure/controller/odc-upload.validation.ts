import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  FileValidator,
  MaxFileSizeValidator,
  mixin,
  ParseFilePipe,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { MulterError, StorageEngine } from 'multer';
import { pipeline, Writable } from 'node:stream';

const MAX_FILE_BYTES = 10_485_760;
const MAX_FIELD_BYTES = 8192;
const SIGNATURES = [
  ['application/pdf', Buffer.from('%PDF-')],
  ['image/jpeg', Buffer.from('ffd8ff', 'hex')],
  ['image/png', Buffer.from('89504e470d0a1a0a', 'hex')],
] as const;

class DocumentSignatureValidator extends FileValidator {
  isValid(file?: Express.Multer.File): boolean {
    return SIGNATURES.some(
      ([mime, signature]) =>
        file?.mimetype === mime &&
        file.buffer?.subarray(0, signature.length).equals(signature),
    );
  }

  buildErrorMessage(): string {
    return 'Selecciona un PDF, JPG o PNG válido cuyo contenido coincida con su tipo.';
  }
}

export function createOdcFilePipe(): ParseFilePipe {
  return new ParseFilePipe({
    validators: [
      new DocumentSignatureValidator({}),
      new MaxFileSizeValidator({ maxSize: MAX_FILE_BYTES + 1 }),
    ],
  });
}

// Multer needs one lookahead byte to accept exactly 10 MiB. This storage
// rejects that byte before constructing an oversized Buffer (R2).
const boundedMemoryStorage: StorageEngine = {
  _handleFile(_request, file, callback) {
    let size = 0;
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk: Buffer, _encoding, done) {
        if (size + chunk.length > MAX_FILE_BYTES) {
          done(new MulterError('LIMIT_FILE_SIZE', 'file'));
          return;
        }
        size += chunk.length;
        chunks.push(chunk);
        done();
      },
    });
    pipeline(file.stream, destination, (error) => {
      if (error) callback(error);
      else callback(null, { buffer: Buffer.concat(chunks, size), size });
    });
  },
  _removeFile(_request, file, callback) {
    delete (file as Partial<Express.Multer.File>).buffer;
    callback(null);
  },
};

export function OdcUploadInterceptor(allowedFields: readonly string[]) {
  const limits = {
    fileSize: MAX_FILE_BYTES,
    files: 1,
    fields: allowedFields.length,
    parts: allowedFields.length + 1,
    // Busboy flags a field at equality; validate the business cap below (R4).
    fieldSize: MAX_FIELD_BYTES + 1,
    fieldNameSize: 100,
    fieldArrayIndexLimit: 0,
    fieldNestingDepth: 0,
  };
  const BaseInterceptor = FileInterceptor('file', {
    storage: boundedMemoryStorage,
    limits,
  });

  return mixin(
    class extends BaseInterceptor {
      async intercept(context: ExecutionContext, next: CallHandler) {
        try {
          const result = await super.intercept(context, next);
          const request = context.switchToHttp().getRequest<Request>();
          const body = request.body as Record<string, unknown> | undefined;
          if (
            Object.entries(body ?? {}).some(
              ([name, value]) =>
                !allowedFields.includes(name) ||
                typeof value !== 'string' ||
                Buffer.byteLength(value, 'utf8') > MAX_FIELD_BYTES,
            )
          ) {
            throw new BadRequestException(
              'Los campos del archivo no son válidos o superan 8192 bytes.',
            );
          }
          return result;
        } catch (error) {
          // Nest 11 translates Multer messages; use stable codes for new codes
          // and the changed "Unexpected file field" message in Multer 2.4.
          if (error instanceof MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              throw new PayloadTooLargeException(
                'El archivo no puede superar 10 MB.',
              );
            }
            throw new BadRequestException(
              'Los campos del archivo no son válidos.',
            );
          }
          throw error;
        }
      }
    },
  );
}
