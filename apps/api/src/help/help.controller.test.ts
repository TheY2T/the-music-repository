import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CACHE_PUBLIC_MEDIUM } from '../http/cache-control';
import { GetHelpTopicUseCase, ListHelpTopicsUseCase } from './application/help-topic.use-cases';
import { HelpController } from './help.controller';

// Confirms the `@Header` decorator actually emits the shared-cache policy over HTTP (a public,
// guard-free read is representative of every `@Header`-tagged catalogue/collections/help/faq route).
describe('HelpController caching (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HelpController],
      providers: [
        { provide: ListHelpTopicsUseCase, useValue: { execute: vi.fn().mockResolvedValue([]) } },
        { provide: GetHelpTopicUseCase, useValue: { execute: vi.fn().mockResolvedValue({}) } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('sets the public medium Cache-Control on the topic list', async () => {
    const res = await request(app.getHttpServer()).get('/help-topics');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(CACHE_PUBLIC_MEDIUM);
  });
});
