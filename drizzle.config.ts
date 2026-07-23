import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// 检测测试环境 (通过命令行参数或环境变量)
const isTestEnv =
  process.argv.includes("--test") || process.env.USE_TEST_DB === "true";

// 根据环境加载对应的环境变量文件
if (isTestEnv) {
  dotenv.config({ path: ".env.test" });
} else {
  // 加载环境变量 (优先 .env.local，其次 .env)
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
}

// `generate` 只读取 Schema，不连接数据库，因此允许使用不会实际访问的占位 URL。
// `migrate`、`push` 和 `studio` 仍会在连接阶段拒绝这个地址。
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://drizzle:drizzle@127.0.0.1:5432/drizzle";

/**
 * Drizzle Kit 配置
 * 用于管理数据库迁移和 Schema 推送
 */
export default defineConfig({
  // 数据库 Schema 文件路径
  schema: "./src/db/schema/index.ts",

  // 迁移文件输出目录
  out: "./drizzle",

  // 数据库类型: PostgreSQL
  dialect: "postgresql",

  // 数据库连接配置 (从环境变量读取)
  dbCredentials: {
    url: databaseUrl,
  },

  // 启用详细日志
  verbose: true,

  // 启用严格模式 (迁移前需确认)
  strict: true,
});
