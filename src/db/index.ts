import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeonWs } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getRuntimeEnv } from "@/lib/runtime-config";

import * as schema from "./schema/index";

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

/**
 * 创建数据库实例
 * - Neon: 使用 WebSocket 连接 (支持事务，兼容 Node.js 和 Edge)
 * - 标准 PG: 使用连接池 (本地开发/Docker)
 */
function createDatabaseConnection(databaseUrl: string) {
  const isNeon = databaseUrl.includes("neon.tech");
  const isNodeJs = typeof process !== "undefined" && process.versions?.node;

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
    closeDatabaseConnection = () => pool.end();
    return drizzleNeonWs(pool, { schema });
  }

  // 标准 PostgreSQL 连接池 (本地开发/Docker)
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  closeDatabaseConnection = () => pool.end();
  return drizzlePg(pool, { schema });
}

type Database = ReturnType<typeof createDatabaseConnection>;

let database: Database | undefined;
let closeDatabaseConnection: (() => Promise<void>) | undefined;

function getDatabase(): Database {
  if (database) return database;

  const databaseUrl = getRuntimeEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL 环境变量未设置，请在 .env 文件中配置数据库连接"
    );
  }

  database = createDatabaseConnection(databaseUrl);
  return database;
}

/**
 * 延迟初始化数据库，避免仅导入认证或健康检查模块时就因缺少 Secret 启动失败。
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const databaseInstance = getDatabase();
    const value = Reflect.get(databaseInstance, property);
    return typeof value === "function" ? value.bind(databaseInstance) : value;
  },
});

export async function closeDatabase(): Promise<void> {
  await closeDatabaseConnection?.();
  closeDatabaseConnection = undefined;
  database = undefined;
}

export type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export function withDbTransaction<T>(
  callback: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> {
  return db.transaction(callback);
}

// 导出 Schema 以便在其他地方使用
export * from "./schema/index";
