/**
 * Edge Runtime 认证函数
 *
 * 用于 Middleware 和 Edge Functions 中验证用户会话
 * Edge Runtime 环境下无法使用完整的数据库连接，
 * 因此使用 Cookie 验证方式
 */

/**
 * 从请求中获取会话 Token
 *
 * @param request - Next.js Request 对象
 * @returns 会话 Token 或 undefined
 */
export function getSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  // Better Auth 使用的 Cookie 名称
  const cookieNames = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token", // HTTPS 环境
  ];

  for (const name of cookieNames) {
    const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * 检查请求是否包含有效的会话 Token
 *
 * 注意: 这只是检查 Token 是否存在，不验证 Token 的有效性
 * 完整的验证需要在服务器端进行
 *
 * @param request - Next.js Request 对象
 * @returns boolean - 是否存在会话 Token
 */
export function hasSessionToken(request: Request): boolean {
  return !!getSessionToken(request);
}

/**
 * 受保护路由的路径模式
 * 用于 Middleware 中判断是否需要认证
 */
export const protectedRoutes = [
  "/dashboard",
  "/dashboard/:path*",
  "/settings",
  "/settings/:path*",
  "/admin",
  "/admin/:path*",
];

/**
 * 认证页面的路径模式
 * 已登录用户访问这些页面时应重定向到 Dashboard
 */
export const authRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

/**
 * 公开路由的路径模式
 * 这些路由不需要认证
 */
export const publicRoutes = [
  "/",
  "/about",
  "/pricing",
  "/blog",
  "/blog/:path*",
  "/docs",
  "/docs/:path*",
];
