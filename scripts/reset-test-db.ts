/**
 * 重置测试数据库
 *
 * 删除所有表和枚举，以便重新推送 schema
 * 运行: npx tsx scripts/reset-test-db.ts
 */

import { neonConfig, Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
import ws from "ws";

// 加载测试环境变量
dotenv.config({ path: ".env.test" });

// 配置 WebSocket
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL not set in .env.test");
}

async function resetTestDb() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("🗑️  正在删除所有表和枚举...");

    // 删除所有表（按依赖顺序）
    await pool.query(`
      DROP TABLE IF EXISTS ticket_message CASCADE;
      DROP TABLE IF EXISTS ticket CASCADE;
      DROP TABLE IF EXISTS subscription CASCADE;
      DROP TABLE IF EXISTS credits_transaction CASCADE;
      DROP TABLE IF EXISTS credits_batch CASCADE;
      DROP TABLE IF EXISTS credits_balance CASCADE;
      DROP TABLE IF EXISTS session CASCADE;
      DROP TABLE IF EXISTS account CASCADE;
      DROP TABLE IF EXISTS verification CASCADE;
      DROP TABLE IF EXISTS "user" CASCADE;
    `);

    // 删除所有枚举类型
    await pool.query(`
      DROP TYPE IF EXISTS credits_balance_status CASCADE;
      DROP TYPE IF EXISTS credits_batch_source CASCADE;
      DROP TYPE IF EXISTS credits_batch_status CASCADE;
      DROP TYPE IF EXISTS credits_transaction_type CASCADE;
      DROP TYPE IF EXISTS credits_status CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `);

    console.log("✅ 测试数据库已重置");
  } catch (error) {
    console.error("❌ 重置失败:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetTestDb();
