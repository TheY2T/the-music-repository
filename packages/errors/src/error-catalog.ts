import type { ErrorCategory } from './domain-error';

/** Category → HTTP status. The single, declarative place transport status is derived. */
export const CATEGORY_TO_STATUS: Record<ErrorCategory, number> = {
  VALIDATION: 400,
  UNPROCESSABLE: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  DEPENDENCY: 502,
  TIMEOUT: 504,
  INTERNAL: 500,
};

export const PROBLEM_TYPE_BASE = 'https://api.themusicrepository.com/problems';
export const ERROR_DOC_BASE = 'https://docs.themusicrepository.com/errors';

export function codeToTypeUri(code: string): string {
  return `${PROBLEM_TYPE_BASE}/${code.toLowerCase().replace(/_/g, '-')}`;
}

export function codeToDocUrl(code: string): string {
  return `${ERROR_DOC_BASE}/${code}`;
}

/** `TRACK_NOT_FOUND` → `Track not found`. */
export function titleFromCode(code: string): string {
  const words = code
    .split('_')
    .map((word, index) =>
      index === 0 ? word.charAt(0) + word.slice(1).toLowerCase() : word.toLowerCase(),
    );
  return words.join(' ');
}
