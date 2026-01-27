/**
 * 存储系统类型定义
 *
 * 定义存储提供者接口和相关类型
 */

// ============================================
// 存储提供者接口
// ============================================

/**
 * 存储提供者接口
 *
 * 所有存储后端 (S3, R2, MinIO 等) 都需要实现此接口
 */
export interface StorageProvider {
  /**
   * 获取签名读取 URL
   *
   * 用于安全地读取存储中的文件
   *
   * @param key - 文件键名 (路径)
   * @param bucket - 存储桶名称
   * @param expiresIn - URL 有效期 (秒)
   * @returns 签名后的 URL
   */
  getSignedUrl(key: string, bucket: string, expiresIn: number): Promise<string>;

  /**
   * 获取签名上传 URL
   *
   * 用于客户端直接上传文件到存储
   *
   * @param key - 文件键名 (路径)
   * @param bucket - 存储桶名称
   * @param contentType - 文件 MIME 类型
   * @param expiresIn - URL 有效期 (秒，可选，默认 300)
   * @returns 签名后的上传 URL
   */
  getSignedUploadUrl(
    key: string,
    bucket: string,
    contentType: string,
    expiresIn?: number
  ): Promise<string>;

  /**
   * 删除文件
   *
   * @param key - 文件键名 (路径)
   * @param bucket - 存储桶名称
   */
  deleteObject(key: string, bucket: string): Promise<void>;
}

// ============================================
// 存储配置类型
// ============================================

/**
 * S3 兼容存储配置
 */
export interface S3StorageConfig {
  /** 访问密钥 ID */
  accessKeyId: string;
  /** 访问密钥 */
  secretAccessKey: string;
  /** 端点 URL (如 Cloudflare R2, MinIO) */
  endpoint: string;
  /** 区域 (如 auto, us-east-1) */
  region: string;
}

// ============================================
// 上传相关类型
// ============================================

/**
 * 上传 URL 请求参数
 */
export interface GetUploadUrlParams {
  /** 文件键名 (完整路径，如 avatars/user-123.jpg) */
  key: string;
  /** 文件 MIME 类型 */
  contentType: string;
  /** 存储桶名称 (可选，默认使用头像桶) */
  bucket?: string;
}

/**
 * 上传 URL 响应
 */
export interface GetUploadUrlResult {
  /** 签名上传 URL */
  uploadUrl: string;
  /** 文件键名 */
  key: string;
  /** 存储桶名称 */
  bucket: string;
}

// ============================================
// 允许的文件类型
// ============================================

/**
 * 允许上传的图片 MIME 类型
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * 允许的图片类型
 */
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * 最大文件大小 (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 默认签名 URL 有效期 (秒)
 */
export const DEFAULT_SIGNED_URL_EXPIRES = 3600; // 1 小时

/**
 * 默认上传 URL 有效期 (秒)
 */
export const DEFAULT_UPLOAD_URL_EXPIRES = 300; // 5 分钟
