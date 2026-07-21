/** A stored media object's bytes and content type. */
export interface MediaObject {
  data: Uint8Array;
  mime: string;
}

/** MediaLibrary — the application's requirement: store media files and hand out shareable links. */
export abstract class MediaLibrary {
  /** A URL the browser can GET the object from directly. */
  abstract presignGetUrl(storageKey: string): Promise<string>;
  /** A URL the browser uploads bytes to directly (CMS media upload). */
  abstract presignPutUrl(storageKey: string, contentType: string): Promise<string>;
  abstract ensureBucket(): Promise<void>;
  abstract putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  /** Read a stored object's bytes + mime, or null when the key is unknown. */
  abstract getObject(storageKey: string): Promise<MediaObject | null>;
}
