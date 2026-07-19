import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  return app;
}
