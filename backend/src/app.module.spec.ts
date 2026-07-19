import { existsSync } from 'fs';
import { join } from 'path';
import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule, configModuleOptions } from './app.module';

describe('R1: global ConfigModule loading the repo root .env', () => {
  it('defines options with isGlobal true and envFilePath pointing to the repo root .env', () => {
    expect(configModuleOptions).toEqual({
      isGlobal: true,
      envFilePath: '../.env',
    });
  });

  it('AppModule registers ConfigModule as a global module with those options', async () => {
    const rawImports = (Reflect.getMetadata('imports', AppModule) ??
      []) as unknown[];
    // ConfigModule.forRoot returns Promise<DynamicModule> since @nestjs/config v4
    const imports = await Promise.all(rawImports);
    const configModuleImport = imports.find(
      (imported): imported is DynamicModule =>
        typeof imported === 'object' &&
        imported !== null &&
        (imported as DynamicModule).module === ConfigModule,
    );
    expect(configModuleImport).toBeDefined();
    expect(configModuleImport?.global).toBe(true);
  });
});

describe('R8: scaffold getHello endpoint removed', () => {
  it.each(['app.controller.ts', 'app.service.ts', 'app.controller.spec.ts'])(
    'scaffold file %s no longer exists',
    (scaffoldFile) => {
      expect(existsSync(join(__dirname, scaffoldFile))).toBe(false);
    },
  );
});
