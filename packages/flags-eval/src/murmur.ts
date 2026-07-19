/**
 * MurmurHash3 x86 32-bit — deterministically buckets `fractional` targeting for percentage rollouts.
 * Returns an unsigned 32-bit integer.
 */
/** Encode a string to its UTF-8 bytes without relying on a `TextEncoder` global (portable to any target). */
function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // high surrogate — combine with the following low surrogate into a code point
      const next = input.charCodeAt(i + 1);
      code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
      i++;
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

export function murmur3_32(input: string, seed = 0): number {
  const bytes = utf8Bytes(input);
  const len = bytes.length;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h1 = seed >>> 0;

  const at = (index: number): number => bytes[index] ?? 0;

  const blockCount = len >> 2; // whole 4-byte blocks
  for (let i = 0; i < blockCount; i++) {
    const offset = i * 4;
    let k1 =
      (at(offset) | (at(offset + 1) << 8) | (at(offset + 2) << 16) | (at(offset + 3) << 24)) >>> 0;
    k1 = Math.imul(k1, c1) >>> 0;
    k1 = ((k1 << 15) | (k1 >>> 17)) >>> 0;
    k1 = Math.imul(k1, c2) >>> 0;

    h1 = (h1 ^ k1) >>> 0;
    h1 = ((h1 << 13) | (h1 >>> 19)) >>> 0;
    h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
  }

  // tail
  let k1 = 0;
  const tailIndex = blockCount * 4;
  const remaining = len & 3;
  if (remaining === 3) k1 ^= at(tailIndex + 2) << 16;
  if (remaining >= 2) k1 ^= at(tailIndex + 1) << 8;
  if (remaining >= 1) {
    k1 ^= at(tailIndex);
    k1 = Math.imul(k1 >>> 0, c1) >>> 0;
    k1 = ((k1 << 15) | (k1 >>> 17)) >>> 0;
    k1 = Math.imul(k1, c2) >>> 0;
    h1 = (h1 ^ k1) >>> 0;
  }

  // finalisation
  h1 = (h1 ^ len) >>> 0;
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h1 = Math.imul(h1, 0x85ebca6b) >>> 0;
  h1 = (h1 ^ (h1 >>> 13)) >>> 0;
  h1 = Math.imul(h1, 0xc2b2ae35) >>> 0;
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;

  return h1 >>> 0;
}
