import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { processExpiredBatches } from "@/features/credits/core";

/**
 * 积分过期处理 Cron Job API
 *
 * 定期调用此 API 来处理过期的积分批次
 * 需要通过 Bearer Token 进行身份验证
 *
 * 配置 Vercel Cron:
 * 在 vercel.json 中添加:
 * {
 *   "crons": [{
 *     "path": "/api/jobs/credits/expire",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * 或使用外部 Cron 服务调用
 */

/**
 * 验证 Cron Job 请求的 Bearer Token
 */
function validateCronSecret(authHeader: string | null): boolean {
  if (!authHeader) return false;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SECRET environment variable is not set");
    return false;
  }

  // 支持 Bearer Token 格式
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === cronSecret;
}

/**
 * POST /api/jobs/credits/expire
 *
 * 处理所有过期的积分批次
 */
export async function POST() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  // 验证身份
  if (!validateCronSecret(authHeader)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // 执行过期处理
    const results = await processExpiredBatches();

    // 返回处理结果
    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results.map((r) => ({
        batchId: r.batchId,
        userId: r.userId,
        expiredAmount: r.expiredAmount,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to process expired batches:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process expired batches",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/credits/expire
 *
 * 健康检查端点，用于验证 Cron Job 配置是否正确
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/jobs/credits/expire",
    method: "POST",
    description: "Process expired credit batches",
    authentication: "Bearer token required (CRON_SECRET)",
  });
}
