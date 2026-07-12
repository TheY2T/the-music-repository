// Verovio ships no bundled type declarations for its subpath exports.
// We only use a thin slice of the toolkit (see ScoreRenderer.tsx), so declare
// the modules as untyped and narrow them at the call site.
declare module 'verovio/esm';
declare module 'verovio/wasm';
