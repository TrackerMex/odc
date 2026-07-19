import { INestApplication, ValidationPipe } from '@nestjs/common';
import { configureApp } from './bootstrap';

interface AppMock {
  setGlobalPrefix: jest.Mock;
  useGlobalPipes: jest.Mock;
}

function createAppMock(): AppMock {
  return {
    setGlobalPrefix: jest.fn(),
    useGlobalPipes: jest.fn(),
  };
}

describe('R4: global ValidationPipe with whitelist enabled', () => {
  it('registers a ValidationPipe built with whitelist true', () => {
    const appMock = createAppMock();

    configureApp(appMock as unknown as INestApplication);

    expect(appMock.useGlobalPipes).toHaveBeenCalledTimes(1);
    const [pipe] = appMock.useGlobalPipes.mock.calls[0] as [ValidationPipe];
    expect(pipe).toBeInstanceOf(ValidationPipe);
    const pipeInternals = pipe as unknown as {
      validatorOptions: { whitelist?: boolean };
    };
    expect(pipeInternals.validatorOptions.whitelist).toBe(true);
  });
});

describe("R5: global route prefix 'api'", () => {
  it("sets the global prefix to 'api'", () => {
    const appMock = createAppMock();

    configureApp(appMock as unknown as INestApplication);

    expect(appMock.setGlobalPrefix).toHaveBeenCalledWith('api');
  });
});
