import { describe, expect, it } from 'vitest';
import {
  HTML_PRIVATE_CACHE_CONTROL,
  HTML_SHARED_CACHE_CONTROL,
  htmlCachePolicy,
  isPrivatePath,
} from './http-cache';

const anonPublic = { method: 'GET', status: 200, authenticated: false, path: '/catalogue' };

describe('htmlCachePolicy', () => {
  it('shares an anonymous GET of a public page', () => {
    const policy = htmlCachePolicy(anonPublic);
    expect(policy.shared).toBe(true);
    expect(policy.cacheControl).toBe(HTML_SHARED_CACHE_CONTROL);
  });

  it('never shares an authenticated request', () => {
    const policy = htmlCachePolicy({ ...anonPublic, authenticated: true });
    expect(policy.shared).toBe(false);
    expect(policy.cacheControl).toBe(HTML_PRIVATE_CACHE_CONTROL);
  });

  it('never shares a private route even when anonymous', () => {
    for (const path of ['/admin', '/admin/feature-flags', '/account/profile', '/dashboard']) {
      expect(htmlCachePolicy({ ...anonPublic, path }).shared).toBe(false);
    }
  });

  it('never shares a non-GET or non-200 response', () => {
    expect(htmlCachePolicy({ ...anonPublic, method: 'POST' }).shared).toBe(false);
    expect(htmlCachePolicy({ ...anonPublic, status: 302 }).shared).toBe(false);
    expect(htmlCachePolicy({ ...anonPublic, status: 404 }).shared).toBe(false);
  });
});

describe('isPrivatePath', () => {
  it('matches a prefix exactly and as a segment boundary', () => {
    expect(isPrivatePath('/signin')).toBe(true);
    expect(isPrivatePath('/signin/callback')).toBe(true);
    // A public path that merely starts with the same letters is not private.
    expect(isPrivatePath('/accountability')).toBe(false);
    expect(isPrivatePath('/')).toBe(false);
    expect(isPrivatePath('/tools/keyboard')).toBe(false);
  });
});
