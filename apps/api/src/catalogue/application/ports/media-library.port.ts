/** MediaLibrary — the application's requirement: store media files and hand out shareable links. */
export abstract class MediaLibrary {
  /** A time-limited GET URL the browser can use directly. */
  abstract presignGetUrl(storageKey: string): Promise<string>;
  abstract ensureBucket(): Promise<void>;
  abstract putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
}
