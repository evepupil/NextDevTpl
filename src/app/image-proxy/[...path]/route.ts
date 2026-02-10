/**
 * Image Proxy 路由
 *
 * 安全地代理访问存储中的图片
 * 路由: /image-proxy/{bucket}/{key}
 *
 * 示例: /image-proxy/avatars/user-123-1234567890.jpg
 */

import { type NextRequest, NextResponse } from "next/server";

import { getStorageProvider } from "@/features/storage/providers";
import { DEFAULT_SIGNED_URL_EXPIRES } from "@/features/storage/types";

// ============================================
// 配置
// ============================================

/**
 * 获取允许的存储桶白名单
 *
 * 安全措施：只允许代理访问预定义的存储桶
 */
function getAllowedBuckets(): string[] {
  const avatarsBucket = process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME;

  const buckets: string[] = [];

  if (avatarsBucket) {
    buckets.push(avatarsBucket);
  }

  return buckets;
}

/**
 * 缓存时间 (秒)
 *
 * 与签名 URL 有效期保持一致
 */
const CACHE_MAX_AGE = DEFAULT_SIGNED_URL_EXPIRES;

// ============================================
// 路由处理器
// ============================================

/**
 * GET /image-proxy/[...path]
 *
 * 代理图片请求，生成签名 URL 并重定向
 *
 * @param _request - Next.js 请求对象 (未使用)
 * @param params - 路由参数 (path 数组)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    // 解析路径: [bucket, ...keyParts]
    if (!path || path.length < 2) {
      return NextResponse.json(
        { error: "Invalid path: expected /image-proxy/{bucket}/{key}" },
        { status: 400 }
      );
    }

    const [bucket, ...keyParts] = path;
    const key = keyParts.join("/");

    // 安全检查：验证存储桶在白名单中
    const allowedBuckets = getAllowedBuckets();
    if (!bucket || !allowedBuckets.includes(bucket)) {
      console.warn(`[Image Proxy] 拒绝访问未授权的存储桶: ${bucket}`);
      return NextResponse.json(
        { error: "Bucket not allowed" },
        { status: 403 }
      );
    }

    // 验证文件键名不为空
    if (!key) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // 生成签名 URL
    const provider = getStorageProvider();
    const signedUrl = await provider.getSignedUrl(
      key,
      bucket,
      CACHE_MAX_AGE
    );

    // 重定向到签名 URL
    // 设置缓存头，让浏览器/CDN 缓存响应
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        // 告诉 CDN 可以缓存
        "CDN-Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    console.error("[Image Proxy] 错误:", error);

    // 返回错误响应
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}

// ============================================
// 路由配置
// ============================================

/**
 * 运行时配置
 *
 * 使用 Edge Runtime 以获得更好的性能
 * 注意：如果 S3 客户端不支持 Edge，可以切换回 nodejs
 */
// export const runtime = "edge";

/**
 * 动态路由配置
 *
 * 强制动态渲染，因为签名 URL 需要实时生成
 */
export const dynamic = "force-dynamic";
