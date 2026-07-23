import type { AdapterDescriptor } from "./common";

export type StorageProviderName = "r2-binding" | "s3-compatible";

export interface StorageCapabilities {
  directRead: boolean;
  directWrite: boolean;
  signedDownloadUrls: boolean;
  signedUploadUrls: boolean;
}

export interface StorageObject {
  body: Uint8Array;
  contentType?: string;
  etag?: string;
}

export interface StorageWriteInput {
  body: ArrayBuffer | Blob | ReadableStream<Uint8Array> | Uint8Array | string;
  bucket: string;
  contentType?: string;
  key: string;
}

export interface StorageUrlInput {
  bucket: string;
  expiresIn: number;
  key: string;
}

export interface StorageUploadUrlInput extends StorageUrlInput {
  contentType: string;
}

export interface StorageAdapter
  extends AdapterDescriptor<StorageProviderName, StorageCapabilities> {
  createDownloadUrl(input: StorageUrlInput): Promise<string>;
  createUploadUrl(input: StorageUploadUrlInput): Promise<string>;
  deleteObject(bucket: string, key: string): Promise<void>;
  readObject(bucket: string, key: string): Promise<StorageObject | null>;
  writeObject(input: StorageWriteInput): Promise<void>;
}
