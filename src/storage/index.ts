/**
 * 存储系统模块入口
 *
 * 统一导出存储系统的所有公开 API
 */

// ============================================
// 类型导出
// ============================================

export type {
  StorageProvider,
  S3StorageConfig,
  GetUploadUrlParams,
  GetUploadUrlResult,
  AllowedImageType,
} from "./types";

export {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  DEFAULT_SIGNED_URL_EXPIRES,
  DEFAULT_UPLOAD_URL_EXPIRES,
} from "./types";

// ============================================
// 存储提供者导出
// ============================================

export { s3Provider, getStorageProvider } from "./providers";

// ============================================
// 工具函数导出
// ============================================

export { isExternalUrl, getAvatarUrl, generateAvatarKey } from "./utils";

// ============================================
// Server Actions 导出
// ============================================

export { getSignedUploadUrlAction, deleteFileAction } from "./actions";
