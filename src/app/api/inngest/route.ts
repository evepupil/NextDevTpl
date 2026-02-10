import { serve } from "inngest/next";
import { inngest, functions } from "@/inngest";
import { withApiLogging } from "@/lib/api-logger";

/**
 * Inngest API 路由
 *
 * 处理 Inngest 的 webhook 请求
 * 支持开发模式和生产模式
 */
const inngestHandlers = serve({
  client: inngest,
  functions,
});

export const GET = withApiLogging(inngestHandlers.GET);
export const POST = withApiLogging(inngestHandlers.POST);
export const PUT = withApiLogging(inngestHandlers.PUT);
