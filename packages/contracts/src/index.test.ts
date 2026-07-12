import { describe, expect, it } from 'vitest';
import { CreateCollectionBody } from './index';

// The generated Zod DTOs are the runtime contract enforced by the API's ZodValidationPipe. This
// exemplar proves a representative generated schema round-trips valid input and rejects malformed
// input — the guarantee the pipe relies on to return 422 problem+json. Regenerating the spec keeps
// this honest: a breaking contract change surfaces here.
describe('CreateCollectionBody (generated Zod DTO)', () => {
  it('parses a valid collection payload', () => {
    const parsed = CreateCollectionBody.parse({
      slug: 'jazz-standards',
      title: 'Jazz Standards',
      kind: 'course',
    });
    expect(parsed.slug).toBe('jazz-standards');
    expect(parsed.kind).toBe('course');
  });

  it('rejects a payload missing a required field', () => {
    const result = CreateCollectionBody.safeParse({ slug: 'no-title', kind: 'course' });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-enum value', () => {
    const result = CreateCollectionBody.safeParse({
      slug: 'bad-kind',
      title: 'Bad Kind',
      kind: 'not-a-kind',
    });
    expect(result.success).toBe(false);
  });
});
