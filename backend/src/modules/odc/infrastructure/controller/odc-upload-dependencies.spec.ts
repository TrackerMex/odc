import { createRequire } from 'node:module';

describe('R5: patched Multer in both runtime dependency paths (#34)', () => {
  const nestRequire = createRequire(
    require.resolve('@nestjs/platform-express'),
  );

  it.each([
    ['application', require as NodeRequire],
    ['Nest FileInterceptor', nestRequire],
  ])('%s resolves Multer >= 2.3.0', (_name, resolvePackage) => {
    const { version } = resolvePackage('multer/package.json') as {
      version: string;
    };
    const [major, minor] = version.split('.').map(Number);
    expect(major > 2 || (major === 2 && minor >= 3)).toBe(true);
  });
});
