import { z } from "zod";

/**
 * 支持的文件类型
 */
export type SupportedFileType = "pdf" | "doc" | "docx" | "md" | "txt";

/**
 * 文件类型 MIME 映射
 */
export const FILE_MIME_TYPES: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/markdown": "md",
  "text/plain": "txt",
};

/**
 * 文件扩展名映射
 */
export const FILE_EXTENSIONS: Record<string, SupportedFileType> = {
  ".pdf": "pdf",
  ".doc": "doc",
  ".docx": "docx",
  ".md": "md",
  ".txt": "txt",
};

export const DOCUMENT_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".md",
  ".txt",
] as const;
export const MAX_DOCUMENT_UPLOAD_SIZE = 10 * 1024 * 1024;

const documentUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(128),
  fileSize: z.number().finite().int().positive().max(MAX_DOCUMENT_UPLOAD_SIZE),
});

export type DocumentUploadRequest = z.infer<typeof documentUploadSchema>;

export type DocumentUploadValidationResult =
  | { success: true; data: DocumentUploadRequest }
  | { success: false; reason: "invalid_request" | "unsupported_type" };

export function validateDocumentUploadRequest(
  input: unknown
): DocumentUploadValidationResult {
  const parsed = documentUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, reason: "invalid_request" };
  }

  const fileType = getFileTypeFromName(parsed.data.filename);
  const contentTypeFileType = getFileTypeFromMime(parsed.data.contentType);
  if (!fileType || fileType !== contentTypeFileType) {
    return { success: false, reason: "unsupported_type" };
  }

  return { success: true, data: parsed.data };
}

/**
 * 从文件名获取文件类型
 */
export function getFileTypeFromName(
  filename: string
): SupportedFileType | null {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext) return null;
  return FILE_EXTENSIONS[ext] || null;
}

/**
 * 从 MIME 类型获取文件类型
 */
export function getFileTypeFromMime(
  mimeType: string
): SupportedFileType | null {
  return FILE_MIME_TYPES[mimeType] || null;
}
