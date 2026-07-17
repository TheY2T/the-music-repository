// @TheY2T/tmr-music-core — portable, mostly-headless music logic + interactive infra (audio, theory,
// alphaTab score engine, PixiJS scenes/boundary, hooks). Consumers import concrete modules via
// subpaths (e.g. `@TheY2T/tmr-music-core/music-theory`, `/pixi/PixiCanvas`, `/score/alphatab-engine`).
// This barrel surfaces the core theory helpers for convenience.
export * from './music-theory';
