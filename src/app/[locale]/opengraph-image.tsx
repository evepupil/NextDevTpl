import { siteConfig } from "@/config";
import { createOgImageResponse, OG_IMAGE_SIZE } from "@/shared/og-image-template";

/**
 * Open Graph 图片配置
 */
export const runtime = "edge";
export const alt = siteConfig.name;
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

/**
 * 动态生成 Open Graph 图片
 */
export default async function Image() {
  return createOgImageResponse();
}
