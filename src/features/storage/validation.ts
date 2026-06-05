/**
 * 存储安全校验
 *
 * 这些是纯函数，既被 storage/actions.ts 在生产路径中调用，
 * 也被 src/test/storage/security.test.ts 直接导入测试 ——
 * 单一事实来源，避免测试与生产逻辑漂移。
 */

import { ALLOWED_IMAGE_TYPES, type AllowedImageType } from "./types";

/** 文件键名允许的字符集（字母、数字、连字符、下划线、斜杠、点） */
export const STORAGE_KEY_REGEX = /^[a-zA-Z0-9\-_/.]+$/;

/** 文件键名最大长度 */
export const MAX_KEY_LENGTH = 255;

/**
 * 校验文件键名格式
 *
 * 安全检查:
 * - 长度 1-255
 * - 显式拦截路径遍历 `..`（注意: 字符正则允许 `.`，故必须单独拦截 `..`）
 * - 禁止以 `/` 开头/结尾、禁止空路径段 `//`
 * - 仅允许白名单字符
 */
export function validateKeyFormat(key: string): boolean {
  if (key.length < 1 || key.length > MAX_KEY_LENGTH) {
    return false;
  }
  // 路径遍历防护：正则允许单个 '.'，'..' 会通过正则，必须显式拦截
  if (key.includes("..")) {
    return false;
  }
  // 禁止绝对路径、尾随斜杠与空路径段
  if (key.startsWith("/") || key.endsWith("/") || key.includes("//")) {
    return false;
  }
  return STORAGE_KEY_REGEX.test(key);
}

/**
 * 校验文件归属
 *
 * 与旧实现 `key.includes(userId)` 的区别：这里要求 userId 必须是键名的
 * **首个路径段**（锚定匹配），而非任意位置的子串。这样可以阻止：
 * - 子串伪造：`evil-${userId}/x.jpg`、`${userId}extra/x.jpg`
 * - 跨用户访问：`other-user/${userId}-decoy/x.jpg`
 *
 * 规范键名格式为 `${userId}/...`（参见 utils.ts 的 generateAvatarKey）。
 */
export function isKeyOwnedByUser(key: string, userId: string): boolean {
  if (!userId || !key) {
    return false;
  }
  const segments = key.split("/");
  const [firstSegment, ...rest] = segments;
  // 首段必须严格等于 userId，且其后至少还有一个非空文件段
  return firstSegment === userId && rest.length > 0 && rest.every(Boolean);
}

/**
 * 校验存储桶是否在白名单中
 */
export function validateBucket(
  bucket: string,
  allowedBuckets: string[]
): boolean {
  return allowedBuckets.includes(bucket);
}

/**
 * 校验 ContentType 是否为允许的图片类型
 */
export function validateContentType(
  contentType: string
): contentType is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}

/** 上传校验入参 */
export interface UploadValidationParams {
  key: string;
  bucket: string;
  contentType: string;
  userId: string;
  allowedBuckets: string[];
}

/** 校验结果 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 完整校验上传请求
 *
 * 校验顺序: 存储桶 → 键名格式 → 文件归属 → ContentType
 */
export function validateUploadRequest(
  params: UploadValidationParams
): ValidationResult {
  const { key, bucket, contentType, userId, allowedBuckets } = params;

  if (!validateBucket(bucket, allowedBuckets)) {
    return { valid: false, error: "不允许访问该存储桶" };
  }
  if (!validateKeyFormat(key)) {
    return { valid: false, error: "文件键名包含非法字符或长度不符" };
  }
  if (!isKeyOwnedByUser(key, userId)) {
    return { valid: false, error: "文件路径无效：必须以用户 ID 作为前缀" };
  }
  if (!validateContentType(contentType)) {
    return {
      valid: false,
      error: `只支持以下文件类型: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }
  return { valid: true };
}

/** 删除校验入参 */
export interface DeleteValidationParams {
  key: string;
  bucket: string;
  userId: string;
  allowedBuckets: string[];
}

/**
 * 完整校验删除请求
 *
 * 校验顺序: 存储桶 → 键名格式 → 文件归属
 */
export function validateDeleteRequest(
  params: DeleteValidationParams
): ValidationResult {
  const { key, bucket, userId, allowedBuckets } = params;

  if (!validateBucket(bucket, allowedBuckets)) {
    return { valid: false, error: "不允许访问该存储桶" };
  }
  if (!validateKeyFormat(key)) {
    return { valid: false, error: "文件键名包含非法字符或长度不符" };
  }
  if (!isKeyOwnedByUser(key, userId)) {
    return { valid: false, error: "无权操作此文件" };
  }
  return { valid: true };
}
