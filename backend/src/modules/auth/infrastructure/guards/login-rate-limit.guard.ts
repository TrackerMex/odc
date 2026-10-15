import { isEmail } from 'class-validator';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { DataSource } from 'typeorm';
import { AuthLoginAttemptOrmEntity } from '../entities/auth-login-attempt.orm-entity';

@Injectable()
export class LoginRateLimitGuard
  implements CanActivate, OnModuleInit, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(LoginRateLimitGuard.name);
  private readonly table: string;
  constructor(private readonly source: DataSource) {
    const metadata = source.getMetadata(AuthLoginAttemptOrmEntity);
    const escape = (value: string) => source.driver.escape(value);
    this.table = metadata.schema
      ? `${escape(metadata.schema)}.${escape(metadata.tableName)}`
      : escape(metadata.tableName);
  }
  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.purgeExpired().catch(() =>
        this.logger.warn('login_limit_cleanup_unavailable'),
      );
    }, 60_000);
    this.timer.unref();
  }
  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    let retryAfter: number | null;
    try {
      const body = request.body as { email?: unknown } | undefined;
      retryAfter = await this.consume(
        request.ip ?? request.socket.remoteAddress ?? '',
        body?.email,
      );
    } catch {
      throw new ServiceUnavailableException(
        'No se puede iniciar sesión en este momento.',
      );
    }
    if (retryAfter !== null) {
      response.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        'Demasiados intentos. Intenta de nuevo más tarde.',
        429,
      );
    }
    return true;
  }

  async consume(ip: string, email: unknown): Promise<number | null> {
    const keys = [
      { key: hashKey('i', normalizeIp(ip)), limit: 60, seconds: 60 },
      { key: hashKey('a', normalizeAccount(email)), limit: 5, seconds: 900 },
    ];
    return this.source.transaction(async (manager) => {
      // Always IP before account: blocked peers cannot spend other accounts' quota.
      for (const { key, limit, seconds } of keys) {
        const [row] = await manager.query<
          { attempts: number; retryAfter: number }[]
        >(
          `
          INSERT INTO ${this.table} AS counter (key, attempts, "expiresAt")
          VALUES ($1, 1, statement_timestamp() + $2::int * interval '1 second')
          ON CONFLICT (key) DO UPDATE SET
            attempts = CASE WHEN counter."expiresAt" <= statement_timestamp()
              THEN 1 ELSE LEAST(counter.attempts + 1, $3::int + 1) END,
            "expiresAt" = CASE WHEN counter."expiresAt" <= statement_timestamp()
              THEN statement_timestamp() + $2::int * interval '1 second' ELSE counter."expiresAt" END
          RETURNING attempts, GREATEST(1, CEIL(EXTRACT(EPOCH FROM "expiresAt" - statement_timestamp())))::int AS "retryAfter"
        `,
          [key, seconds, limit],
        );
        if (row.attempts > limit) return row.retryAfter;
      }
      return null;
    });
  }

  async purgeExpired(): Promise<void> {
    await this.source.query(`DELETE FROM ${this.table} WHERE key IN (
      SELECT key FROM ${this.table} WHERE "expiresAt" <= statement_timestamp()
      ORDER BY "expiresAt" LIMIT 1000 FOR UPDATE SKIP LOCKED
    )`);
  }
}
function hashKey(kind: 'i' | 'a', value: string): string {
  return `${kind}:${createHash('sha256').update(value).digest('hex')}`;
}
function normalizeIp(value: string): string {
  const version = isIP(value);
  if (version === 4) return value;
  if (version !== 6) throw new Error('Invalid client IP');
  const normalized = new URL(`http://[${value.split('%')[0]}]`).hostname.slice(
    1,
    -1,
  );
  const mapped = /^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/.exec(normalized);
  if (!mapped) return normalized;
  const high = parseInt(mapped[1], 16),
    low = parseInt(mapped[2], 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

function normalizeAccount(value: unknown): string {
  if (typeof value !== 'string' || value.length > 254) return 'invalid-email';
  const normalized = value.trim().toLowerCase();
  return isEmail(normalized) ? normalized : 'invalid-email';
}
