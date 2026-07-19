import { ConfigService } from '@nestjs/config';
import { typeOrmModuleOptionsFactory } from './typeorm.config';

function createConfigServiceMock(
  env: Record<string, string | undefined>,
): ConfigService {
  return {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService;
}

describe('R2: TypeORM options built from DATABASE_URL', () => {
  it('produces postgres options with url from DATABASE_URL and autoLoadEntities true', () => {
    const configService = createConfigServiceMock({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/odc',
    });

    const options = typeOrmModuleOptionsFactory(configService);

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgres://user:pass@localhost:5432/odc',
      autoLoadEntities: true,
    });
  });
});

describe('R3: synchronize disabled only in production', () => {
  it('sets synchronize false when NODE_ENV is production', () => {
    const configService = createConfigServiceMock({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/odc',
      NODE_ENV: 'production',
    });

    const options = typeOrmModuleOptionsFactory(configService);

    expect(options.synchronize).toBe(false);
  });

  it('sets synchronize true when NODE_ENV is development', () => {
    const configService = createConfigServiceMock({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/odc',
      NODE_ENV: 'development',
    });

    const options = typeOrmModuleOptionsFactory(configService);

    expect(options.synchronize).toBe(true);
  });

  it('sets synchronize true when NODE_ENV is not defined', () => {
    const configService = createConfigServiceMock({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/odc',
    });

    const options = typeOrmModuleOptionsFactory(configService);

    expect(options.synchronize).toBe(true);
  });
});
