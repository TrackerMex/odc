import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { createServer, request as httpRequest, Server } from 'node:http';
import request from 'supertest';
import * as bootstrap from './bootstrap';

const resolve = (
  bootstrap as typeof bootstrap & {
    resolveTrustedProxies(env: NodeJS.ProcessEnv): string[];
  }
).resolveTrustedProxies;
@Controller('probe')
class ProbeController {
  @Get() probe(@Req() req: Request) {
    return { ip: req.ip };
  }
}
const configure = bootstrap.configureApp as (
  app: INestApplication,
  trusted: string[],
) => INestApplication;
describe('R2,R5: explicit trusted proxy allowlist', () => {
  it('defaults to no trusted peers', () => expect(resolve({})).toEqual([]));
  it('accepts explicit IPv4/IPv6 hosts and subnets', () => {
    expect(
      resolve({
        TRUSTED_PROXY_CIDRS: '127.0.0.2,10.42.0.0/24,2001:db8::1/128',
      }),
    ).toEqual(['127.0.0.2', '10.42.0.0/24', '2001:db8::1/128']);
  });
  it.each([
    'true',
    'false',
    '1',
    'loopback',
    '*',
    '0.0.0.0/0',
    '::/0',
    '127.0.0.2/33',
    '::1/129',
    'not-an-ip',
    '127.0.0.2,',
    Array(33).fill('127.0.0.2').join(','),
  ])('rejects unsafe/malformed setting %s', (value) => {
    expect(() => resolve({ TRUSTED_PROXY_CIDRS: value })).toThrow();
  });
  it.each([{ trusted: [] }, { trusted: ['127.0.0.2'] }])(
    'a direct untrusted client cannot replace its identity with XFF (%j)',
    async ({ trusted }) => {
      const module = await Test.createTestingModule({
        controllers: [ProbeController],
      }).compile();
      const app = configure(module.createNestApplication(), trusted);
      try {
        await app.listen(0, '127.0.0.1');
        const res = await request(app.getHttpServer() as Server)
          .get('/api/probe')
          .set('X-Forwarded-For', '198.51.100.9')
          .expect(200);
        expect(res.body).toEqual({ ip: '127.0.0.1' });
      } finally {
        await app.close();
      }
    },
  );
  it('a trusted local proxy appending real peer defeats attacker-supplied XFF', async () => {
    const module = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    const app = configure(module.createNestApplication(), ['127.0.0.2']);
    await app.listen(0, '127.0.0.1');
    const backend = app.getHttpServer() as Server;
    const port = (backend.address() as { port: number }).port;
    const proxy = createServer((req, res) => {
      const upstream = httpRequest(
        {
          host: '127.0.0.1',
          port,
          localAddress: '127.0.0.2',
          path: req.url,
          headers: {
            'x-forwarded-for': `${String(req.headers['x-forwarded-for'] ?? '')}, ${req.socket.remoteAddress}`,
          },
        },
        (response) => {
          res.writeHead(response.statusCode!, response.headers);
          response.pipe(res);
        },
      );
      upstream.on('error', () => {
        res.statusCode = 502;
        res.end();
      });
      upstream.end();
    });
    try {
      await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', r));
      const res = await request(proxy)
        .get('/api/probe')
        .set('X-Forwarded-For', '198.51.100.9')
        .expect(200);
      expect(res.body).toEqual({ ip: '127.0.0.1' });
    } finally {
      await new Promise<void>((r) => proxy.close(() => r()));
      await app.close();
    }
  });
});
