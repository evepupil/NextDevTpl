import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_SIGNED_URL_EXPIRES } from "@/features/storage/types";
import { withApiLogging } from "@/lib/api-logger";
import { getServerSession } from "@/lib/auth/server";
import {
  DOCUMENT_UPLOAD_EXTENSIONS,
  validateDocumentUploadRequest,
} from "@/lib/file-utils";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";
import { storageService } from "@/services/storage";

const BUCKET_NAME =
  getRuntimeEnv("STORAGE_BUCKET_NAME") || "nextdevtpl-uploads";

/**
 * 允许的文件类型和大小限制
 */
/**
 * 获取预签名上传 URL
 *
 * POST /api/upload/presigned
 * Body: { filename: string, contentType: string, fileSize: number }
 */
export const POST = withApiLogging(async (request: NextRequest) => {
  try {
    // 验证用户登录
    const session = await getServerSession(request.headers);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsedBody = validateDocumentUploadRequest(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error:
            parsedBody.reason === "unsupported_type"
              ? `Unsupported file type or MIME type. Allowed: ${DOCUMENT_UPLOAD_EXTENSIONS.join(", ")}`
              : "Invalid upload request",
        },
        { status: 400 }
      );
    }
    const { filename, contentType, fileSize } = parsedBody.data;

    // 生成唯一的文件 key
    const fileExtension = filename.match(/\.[^.]+$/)?.[0] || "";
    const fileKey = `uploads/${session.user.id}/${nanoid()}${fileExtension}`;

    const presignedUrl = await storageService.createUploadUrl({
      bucket: BUCKET_NAME,
      key: fileKey,
      contentType,
      contentLength: fileSize,
      expiresIn: DEFAULT_SIGNED_URL_EXPIRES,
    });
    const fileUrl = new URL(
      `/image-proxy/${BUCKET_NAME}/${fileKey}`,
      request.url
    ).toString();

    return NextResponse.json({
      presignedUrl,
      fileKey,
      fileUrl,
      expiresIn: DEFAULT_SIGNED_URL_EXPIRES,
    });
  } catch (error) {
    logError(error, { source: "upload-presigned" });
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
});
