/**
 * 清空并重建截图数据库的表结构
 *
 * 每次截图都从零开始：删掉 public 和 drizzle 迁移记录 schema，再把仓库里的迁移完整跑一遍。
 * 这样种子数据永远落在“当前代码对应的表结构”上，也不会残留上一次运行的脏数据。
 */

import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

import { REPO_ROOT } from "../paths";

/** 仓库里的迁移目录（drizzle-kit generate 的输出） */
const MIGRATIONS_FOLDER = path.join(REPO_ROOT, "drizzle");

export async function resetSchema(pool: Pool): Promise<void> {
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("CREATE SCHEMA public");
}

export async function applyMigrations(pool: Pool): Promise<void> {
  await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
}
