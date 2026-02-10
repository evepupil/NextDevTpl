import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { getFileTypeFromName } from "@/lib/file-utils";
import { auth } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logger";

/**
 * S3/R2 客户端配置
 */
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || "auto",
  ...(process.env.STORAGE_ENDPOINT && { endpoint: process.env.STORAGE_ENDPOINT }),
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "nextdevtpl-uploads";

/**
 * 允许的文件类型和大小限制
 */
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".md", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 获取预签名上传 URL
 *
 * POST /api/upload/presigned
 * Body: { filename: string, contentType: string, fileSize: number }
 */
export const POST = withApiLogging(async (request: NextRequest) => {
  try {
    // 验证用户登录
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { filename, contentType, fileSize } = body as {
      filename: string;
      contentType: string;
      fileSize: number;
    };

    // 验证文件名
    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileType = getFileTypeFromName(filename);
    if (!fileType) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 生成唯一的文件 key
    const fileExtension = filename.match(/\.[^.]+$/)?.[0] || "";
    const fileKey = `uploads/${session.user.id}/${nanoid()}${fileExtension}`;

    // 创建预签名 URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // 构建文件访问 URL
    const fileUrl = `${process.env.STORAGE_ENDPOINT}/${BUCKET_NAME}/${fileKey}`;

    return NextResponse.json({
      presignedUrl,
      fileKey,
      fileUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error creating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
});
