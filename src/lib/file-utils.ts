/**
 * 支持的文件类型
 */
export type SupportedFileType = "pdf" | "docx" | "md" | "txt";

/**
 * 文件类型 MIME 映射
 */
export const FILE_MIME_TYPES: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
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
  ".docx": "docx",
  ".md": "md",
  ".txt": "txt",
};

/**
 * 从文件名获取文件类型
 */
export function getFileTypeFromName(
  filename: string,
): SupportedFileType | null {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext) return null;
  return FILE_EXTENSIONS[ext] || null;
}

/**
 * 从 MIME 类型获取文件类型
 */
export function getFileTypeFromMime(
  mimeType: string,
): SupportedFileType | null {
  return FILE_MIME_TYPES[mimeType] || null;
}
