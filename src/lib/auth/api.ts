import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "./index";

/**
 * Better Auth API 处理器
 *
 * 用于 API 路由中处理认证请求
 *
 * @example
 * ```ts
 * // src/app/api/auth/[...all]/route.ts
 * import { GET, POST } from "@/lib/auth/api";
 * export { GET, POST };
 * ```
 */
export const { GET, POST } = toNextJsHandler(auth);
