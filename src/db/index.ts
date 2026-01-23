import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * 数据库连接配置
 *
 * 支持两种模式:
 * 1. Neon Serverless (推荐用于生产环境) - 当 DATABASE_URL 包含 "neon.tech"
 * 2. 标准 PostgreSQL (本地开发/Docker) - 其他情况
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
 * 创建数据库实例
 * - Neon: 使用 HTTP 连接 (边缘兼容)
 * - 标准 PG: 使用连接池 (更好的本地开发体验)
 */
function createDatabaseConnection() {
  if (isNeon) {
    // Neon Serverless HTTP 连接 (Edge Runtime 兼容)
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
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
