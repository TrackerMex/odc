import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const script = resolve(
  __dirname,
  '../../../../../scripts/verify-temporary-file-delivery.cjs',
);

describe('R5: live file verification only runs with explicit test configuration (#35)', () => {
  it.each([
    {
      ODC_CLOUDINARY_TEST: '',
      CLOUDINARY_CLOUD_NAME: 'fake-cloud',
      CLOUDINARY_API_KEY: 'fake-key',
      CLOUDINARY_API_SECRET: 'fake-secret',
    },
    {
      ODC_CLOUDINARY_TEST: '1',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    },
  ])(
    'refuses network/uploads without confirmed test environment and all credentials',
    async (settings) => {
      try {
        await exec(process.execPath, [script], {
          env: { ...process.env, ...settings },
        });
        throw new Error('Probe must refuse unconfigured live requests');
      } catch (error) {
        const result = error as {
          code: number;
          stdout: string;
          stderr: string;
        };
        expect(result.code).toBe(2);
        expect(result.stdout).toContain('NOT RUN');
        expect(result.stdout).not.toContain('fake-secret');
        expect(result.stdout).not.toContain('fake-key');
        expect(result.stderr).toBe('');
      }
    },
  );
});
