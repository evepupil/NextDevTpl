import {
  AdapterError,
  executeAdapterOperation,
  type StorageAdapter,
  type StorageWriteInput,
} from "@/core/services";

interface R2ObjectBodyPort {
  arrayBuffer(): Promise<ArrayBuffer>;
  etag?: string;
  httpMetadata?: { contentType?: string };
}

export interface R2BucketPort {
  delete(key: string): Promise<void>;
  get(key: string): Promise<R2ObjectBodyPort | null>;
  put(
    key: string,
    body: StorageWriteInput["body"],
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
}

export function createR2BindingStorageAdapter(
  buckets: Readonly<Record<string, R2BucketPort>>
): StorageAdapter {
  const provider = "r2-binding" as const;

  function getBucket(name: string): R2BucketPort {
    const bucket = buckets[name];
    if (!bucket) {
      throw new AdapterError({
        code: "configuration",
        message: `R2 binding is not configured for bucket ${name}`,
        provider,
      });
    }
    return bucket;
  }

  function unsupported(operation: string): never {
    throw new AdapterError({
      code: "unsupported",
      message: `${operation} is unavailable through an R2 binding`,
      provider,
    });
  }

  return {
    provider,
    capabilities: {
      directRead: true,
      directWrite: true,
      signedDownloadUrls: false,
      signedUploadUrls: false,
    },

    async createDownloadUrl() {
      return unsupported("Signed download URLs");
    },

    async createUploadUrl() {
      return unsupported("Signed upload URLs");
    },

    async deleteObject(bucket, key) {
      await executeAdapterOperation({
        provider,
        fallbackMessage: "R2 object deletion failed",
        operation: () => getBucket(bucket).delete(key),
      });
    },

    async readObject(bucket, key) {
      const object = await executeAdapterOperation({
        provider,
        fallbackMessage: "R2 object read failed",
        operation: () => getBucket(bucket).get(key),
      });
      if (!object) {
        return null;
      }
      return {
        body: new Uint8Array(await object.arrayBuffer()),
        ...(object.httpMetadata?.contentType
          ? { contentType: object.httpMetadata.contentType }
          : {}),
        ...(object.etag ? { etag: object.etag } : {}),
      };
    },

    async writeObject(input) {
      await executeAdapterOperation({
        provider,
        fallbackMessage: "R2 object write failed",
        operation: () =>
          getBucket(input.bucket).put(input.key, input.body, {
            ...(input.contentType
              ? { httpMetadata: { contentType: input.contentType } }
              : {}),
          }),
      });
    },
  };
}
