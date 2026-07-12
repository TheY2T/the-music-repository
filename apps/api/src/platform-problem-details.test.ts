import { ProblemDetailsExceptionFilter } from '@TheY2T/tmr-nest-platform';
import { LOGGER } from '@TheY2T/tmr-observability';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ContentNotFoundError } from './catalogue/domain/errors/content-not-found.error';

// A throwaway controller that raises a real DomainError — representative of every feature endpoint.
@Controller('things')
class ThingsTestController {
  @Get('missing')
  missing(): never {
    throw new ContentNotFoundError('ghost');
  }

  @Get('ok')
  ok() {
    return { ok: true };
  }
}

// Exercises the platform's anti-corruption boundary end-to-end over HTTP: DomainError → RFC 9457
// problem+json with a stable `code`. No DB/OTEL boot — a fake LOGGER satisfies the filter's only dep.
describe('ProblemDetailsExceptionFilter (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThingsTestController],
      providers: [
        {
          provide: LOGGER,
          useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
        },
        { provide: APP_FILTER, useClass: ProblemDetailsExceptionFilter },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('maps a DomainError to 404 problem+json with its stable code + merged metadata', async () => {
    const res = await request(app.getHttpServer()).get('/things/missing');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.code).toBe('CONTENT_NOT_FOUND');
    expect(res.body.status).toBe(404);
    expect(res.body.type).toContain('content-not-found');
    expect(res.body.slug).toBe('ghost'); // <500 metadata is merged into the problem
  });

  it('passes a successful response through untouched', async () => {
    const res = await request(app.getHttpServer()).get('/things/ok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
