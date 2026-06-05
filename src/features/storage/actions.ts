"use server";

/**
 * 存储系统 Server Actions
 *
 * 提供文件上传和管理的服务端操作接口
 */

import { z } from "zod";

import { protectedAction } from "@/lib/safe-action";

import { getStorageProvider } from "./providers";
import { ALLOWED_IMAGE_TYPES, type AllowedImageType } from "./types";
import { validateUploadRequest } from "./validation";

const withStorageAction = (name: string) =>
  protectedAction.metadata({ action: `storage.${name}` });

// ============================================
// 存储配置
// ============================================

/**
 * 获取头像存储桶名称
 */
function getAvatarsBucket(): string {
  const bucket = process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME;
  if (!bucket) {
    throw new Error("NEXT_PUBLIC_AVATARS_BUCKET_NAME 环境变量未设置");
  }
  return bucket;
}

/**
 * 允许的存储桶白名单
 *
 * 安全措施：只允许访问预定义的存储桶
 */
function getAllowedBuckets(): string[] {
  return [getAvatarsBucket()];
}

// ============================================
// 上传 URL Actions
// ============================================

/**
 * 获取签名上传 URL
 *
 * 受保护的 Action - 需要用户登录
 * 客户端使用此 URL 直接上传文件到存储
 */
export const getSignedUploadUrlAction = withStorageAction("getSignedUploadUrl")
  .schema(
    z.object({
      /** 文件键名 (规范格式为 `${userId}/...`，如 user-123/169.jpg) */
      key: z.string().min(1, "文件键名不能为空").max(255, "文件键名过长"),
      /** 文件 MIME 类型 */
      contentType: z.enum(
        ["image/jpeg", "image/png", "image/gif", "image/webp"],
        {
          message: `只支持以下文件类型: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        }
      ),
      /** 存储桶名称 (可选，默认使用头像桶) */
      bucket: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { key, contentType, bucket: inputBucket } = parsedInput;
    const { userId } = ctx;

    // 确定使用的存储桶
    const bucket = inputBucket ?? getAvatarsBucket();

    // 安全检查：存储桶白名单 + 键名格式(含路径遍历防护) + 文件归属(锚定 userId)
    // 校验逻辑集中在 ./validation，测试直接 import 同一份函数，避免漂移
    const validation = validateUploadRequest({
      key,
      bucket,
      contentType,
      userId,
      allowedBuckets: getAllowedBuckets(),
    });
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 获取签名上传 URL
    const provider = getStorageProvider();
    const uploadUrl = await provider.getSignedUploadUrl(
      key,
      bucket,
      contentType as AllowedImageType
    );

    return {
      uploadUrl,
      key,
      bucket,
    };
  });
