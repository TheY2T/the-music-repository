import { describe, expect, it } from 'vitest';
import {
  CATEGORY_TO_STATUS,
  codeToDocUrl,
  codeToTypeUri,
  NotFoundError,
  titleFromCode,
} from './index';

// A representative concrete domain error, as features declare them.
class TrackNotFound extends NotFoundError {
  readonly code = 'TRACK_NOT_FOUND';
}

describe('DomainError', () => {
  it('carries code + category + metadata and is a real Error', () => {
    const err = new TrackNotFound('no such track', { id: 't1' });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('no such track');
    expect(err.code).toBe('TRACK_NOT_FOUND');
    expect(err.category).toBe('NOT_FOUND');
    expect(err.metadata).toEqual({ id: 't1' });
    expect(err.name).toBe('TrackNotFound');
  });

  it('maps its category to the RFC 9457 HTTP status', () => {
    const err = new TrackNotFound('nope');
    expect(CATEGORY_TO_STATUS[err.category]).toBe(404);
    expect(err.metadata).toEqual({});
  });
});

describe('problem+json derivation helpers', () => {
  it('derives the problem type URI from the code', () => {
    expect(codeToTypeUri('TRACK_NOT_FOUND')).toBe(
      'https://api.themusicrepository.com/problems/track-not-found',
    );
  });

  it('derives the docs URL from the code', () => {
    expect(codeToDocUrl('TRACK_NOT_FOUND')).toBe(
      'https://docs.themusicrepository.com/errors/TRACK_NOT_FOUND',
    );
  });

  it('humanizes an UPPER_SNAKE code into a title', () => {
    expect(titleFromCode('TRACK_NOT_FOUND')).toBe('Track not found');
  });
});
