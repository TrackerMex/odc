import { isIP } from 'node:net';
import type { Express } from 'express';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

export function configureApp(
  app: INestApplication,
  trustedProxies: string[] = [],
): INestApplication {
  const instance = app.getHttpAdapter().getInstance() as Express;
  instance.set('trust proxy', trustedProxies.length ? trustedProxies : false);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());
  return app;
}

export function resolvePort(env: NodeJS.ProcessEnv): number {
  return env.PORT !== undefined ? Number(env.PORT) : 3001;
}

export function resolveTrustedProxies(env: NodeJS.ProcessEnv): string[] {
  const raw = env.TRUSTED_PROXY_CIDRS;
  if (!raw?.trim()) return [];
  const entries = raw.split(',').map((value) => value.trim());
  if (
    raw.length > 2048 ||
    entries.length > 32 ||
    entries.some((entry) => {
      const parts = entry.split('/');
      const version = isIP(parts[0]);
      if (!version || parts.length > 2 || parts[0].includes('%')) return true;
      return (
        parts.length === 2 &&
        (!/^[1-9]\d*$/.test(parts[1]) ||
          Number(parts[1]) > (version === 4 ? 32 : 128))
      );
    })
  )
    throw new Error(
      'TRUSTED_PROXY_CIDRS requiere IPs/CIDRs explícitos, máximo32, sin /0.',
    );
  return [...new Set(entries)];
}

export async function bootstrap(): Promise<void> {
  const trustedProxies = resolveTrustedProxies(process.env);
  const app = await NestFactory.create(AppModule);
  configureApp(app, trustedProxies);
  await app.listen(resolvePort(process.env));
}
