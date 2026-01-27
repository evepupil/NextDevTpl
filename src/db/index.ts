import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeonWs } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * 数据库连接配置
 *
 * 支持两种模式:
 * 1. Neon Serverless WebSocket (生产/测试环境) - 支持事务，兼容 Node.js 和 Edge Runtime
 * 2. 标准 PostgreSQL (本地开发/Docker) - 使用连接池
 *
 * 注意: Neon 始终使用 WebSocket 模式以支持事务
 * - Node.js 环境: 需要 ws 包提供 WebSocket
 * - Edge Runtime (CF Workers/Vercel Edge): 使用原生 WebSocket API
 */

// 确保环境变量存在
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL 环境变量未设置，请在 .env 文件中配置数据库连接"
  );
}

const databaseUrl = process.env.DATABASE_URL;

/**
 * 检测是否使用 Neon Serverless
 */
const isNeon = databaseUrl.includes("neon.tech");

/**
 * 检测是否在 Node.js 环境
 * Edge Runtime (CF Workers, Vercel Edge) 没有 process.versions.node
 */
const isNodeJs = typeof process !== "undefined" && process.versions?.node;

/**
 * 创建数据库实例
 * - Neon: 使用 WebSocket 连接 (支持事务，兼容 Node.js 和 Edge)
 * - 标准 PG: 使用连接池 (本地开发/Docker)
 */
function createDatabaseConnection() {
  if (isNeon) {
    // Node.js 环境需要手动设置 WebSocket 构造函数
    // Edge Runtime (CF Workers, Vercel Edge) 有原生 WebSocket，无需设置
    if (isNodeJs) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ws = require("ws");
      neonConfig.webSocketConstructor = ws;
    }

    // 使用 WebSocket 连接池，支持事务
    const pool = new NeonPool({ connectionString: databaseUrl });
    return drizzleNeonWs(pool, { schema });
  }

  // 标准 PostgreSQL 连接池 (本地开发/Docker)
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  return drizzlePg(pool, { schema });
}

// 导出数据库实例
export const db = createDatabaseConnection();

// 导出 Schema 以便在其他地方使用
export * from "./schema";
