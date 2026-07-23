import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  AdapterError,
  executeAdapterOperation,
  type StorageAdapter,
  type StorageWriteInput,
} from "@/core/services";

interface S3CompatibleConfig {
  accessKeyId?: string;
  endpoint?: string;
  region?: string;
  secretAccessKey?: string;
}

function toSdkBody(
  body: StorageWriteInput["body"]
): NonNullable<PutObjectCommandInput["Body"]> {
  return body instanceof ArrayBuffer ? new Uint8Array(body) : body;
}

export function createS3CompatibleStorageAdapter(
  config: S3CompatibleConfig = {}
): StorageAdapter {
  const provider = "s3-compatible" as const;
  let client: S3Client | undefined;

  function getClient(): S3Client {
    if (client) {
      return client;
    }

    const accessKeyId = config.accessKeyId ?? process.env.STORAGE_ACCESS_KEY_ID;
    const secretAccessKey =
      config.secretAccessKey ?? process.env.STORAGE_SECRET_ACCESS_KEY;
    const endpoint = config.endpoint ?? process.env.STORAGE_ENDPOINT;
    const region = config.region ?? process.env.STORAGE_REGION ?? "auto";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new AdapterError({
        code: "configuration",
        message:
          "Storage credentials are incomplete; configure access key, secret and endpoint",
        provider,
      });
    }

    client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    return client;
  }

  return {
    provider,
    capabilities: {
      directRead: true,
      directWrite: true,
      signedDownloadUrls: true,
      signedUploadUrls: true,
    },

    async createDownloadUrl(input) {
      return executeAdapterOperation({
        provider,
        fallbackMessage: "Signed download URL creation failed",
        operation: () =>
          getSignedUrl(
            getClient(),
            new GetObjectCommand({ Bucket: input.bucket, Key: input.key }),
            { expiresIn: input.expiresIn }
          ),
      });
    },

    async createUploadUrl(input) {
      return executeAdapterOperation({
        provider,
        fallbackMessage: "Signed upload URL creation failed",
        operation: () =>
          getSignedUrl(
            getClient(),
            new PutObjectCommand({
              Bucket: input.bucket,
              Key: input.key,
              ContentType: input.contentType,
            }),
            { expiresIn: input.expiresIn }
          ),
      });
    },

    async deleteObject(bucket, key) {
      await executeAdapterOperation({
        provider,
        fallbackMessage: "Object deletion failed",
        operation: () =>
          getClient().send(
            new DeleteObjectCommand({ Bucket: bucket, Key: key })
          ),
      });
    },

    async readObject(bucket, key) {
      const result = await executeAdapterOperation({
        provider,
        fallbackMessage: "Object read failed",
        operation: () =>
          getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key })),
      });
      if (!result.Body) {
        return null;
      }

      return {
        body: new Uint8Array(await result.Body.transformToByteArray()),
        ...(result.ContentType ? { contentType: result.ContentType } : {}),
        ...(result.ETag ? { etag: result.ETag } : {}),
      };
    },

    async writeObject(input) {
      await executeAdapterOperation({
        provider,
        fallbackMessage: "Object write failed",
        operation: () =>
          getClient().send(
            new PutObjectCommand({
              Bucket: input.bucket,
              Key: input.key,
              Body: toSdkBody(input.body),
              ...(input.contentType ? { ContentType: input.contentType } : {}),
            })
          ),
      });
    },
  };
}
