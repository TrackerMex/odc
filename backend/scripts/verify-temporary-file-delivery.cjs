// Opt-in integration probe: only new assets in a unique test folder are touched.
const configured = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
].every((key) => process.env[key]?.trim());
if (process.env.ODC_CLOUDINARY_TEST !== '1' || !configured) {
  process.stdout.write(
    'NOT RUN: configure a Cloudinary test account and set ODC_CLOUDINARY_TEST=1. Production verification remains blocked.\n',
  );
  process.exit(2);
}

require('reflect-metadata');
const { ConfigService } = require('@nestjs/config');
const { v2: cloudinary } = require('cloudinary');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const {
  CloudinaryFileStorageService,
} = require('../dist/modules/files/infrastructure/services/cloudinary-file-storage.service');
const storage = new CloudinaryFileStorageService(new ConfigService());
const folder = `odc-test/temporary-delivery-${randomUUID()}`;
const assets = [];

async function status(url) {
  // Each request goes to the authenticated API, without a browser/CDN cache.
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store',
  });
  const bytes = await response.arrayBuffer();
  return { status: response.status, bytes: bytes.byteLength };
}
async function mustAllow(url) {
  const result = await status(url);
  if (result.status !== 200 || !result.bytes)
    throw new Error('download-not-allowed');
}
async function mustDeny(url) {
  const result = await status(url);
  if (result.status < 400 || result.status >= 500)
    throw new Error('download-not-denied');
}

(async () => {
  try {
    for (const [extension, mimeType] of [
      ['pdf', 'application/pdf'],
      ['jpg', 'image/jpeg'],
      ['png', 'image/png'],
    ]) {
      const buffer = readFileSync(
        join(__dirname, 'fixtures/temporary-files', `test.${extension}`),
      );
      const publicId = `${folder}/test-${extension}`;
      const result = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${buffer.toString('base64')}`,
        {
          public_id: publicId,
          resource_type: 'auto',
          type: 'authenticated',
          overwrite: false,
        },
      );
      // Capture only a successfully created, uniquely named asset for cleanup.
      if (result.public_id !== publicId)
        throw new Error('unexpected-created-id');
      const reference = {
        publicId,
        resourceType: result.resource_type,
        format: result.format,
      };
      assets.push(reference);
      const url = await storage.getSignedUrl(reference);
      reference.url = url;
      reference.expiresAt = Number(new URL(url).searchParams.get('expires_at'));
      await mustAllow(url);
      const tampered = new URL(url);
      tampered.searchParams.set(
        'expires_at',
        String(reference.expiresAt + 300),
      );
      await mustDeny(tampered);
      process.stdout.write(
        `PASS ${extension}: allowed before expiry; modified expiry denied.\n`,
      );
    }
    const lastExpiry = Math.max(...assets.map((asset) => asset.expiresAt));
    while (Date.now() / 1000 <= lastExpiry + 2) {
      process.stdout.write('Waiting for the actual five-minute expiry.\n');
      await delay(
        Math.min(30_000, Math.max(1, (lastExpiry + 3) * 1000 - Date.now())),
      );
    }
    for (const asset of assets) {
      await mustDeny(asset.url);
      await mustAllow(await storage.getSignedUrl(asset));
      process.stdout.write(
        `PASS ${asset.format}: original denied after expiry; newly authorized URL allowed.\n`,
      );
    }
    process.stdout.write(
      'PASS R5: actual expiry verified for all three formats.\n',
    );
  } catch {
    // Do not print provider errors, signed URLs or credentials.
    process.stderr.write(
      'FAIL R5: actual access check failed. No success is claimed; check the test account configuration.\n',
    );
    process.exitCode = 1;
  } finally {
    for (const asset of assets) {
      try {
        const result = await cloudinary.uploader.destroy(asset.publicId, {
          resource_type: asset.resourceType,
          type: 'authenticated',
          invalidate: true,
        });
        if (!['ok', 'not found'].includes(result.result))
          throw new Error('cleanup-failed');
      } catch {
        // Only this generated id is disclosed so the operator can finish cleanup.
        process.stderr.write(
          `Cleanup failed for test asset ${asset.publicId}; remove only that test asset.\n`,
        );
        process.exitCode = 1;
      }
    }
  }
})();
