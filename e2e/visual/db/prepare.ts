/**
 * 准备截图数据库：起容器 -> 等能连上 -> 清空重建表 -> 写种子
 *
 * 每次运行都完整重来，不依赖上一次留下的任何数据。
 * 容器本身运行结束后保留（下次启动更快），需要时用 `pnpm visual:db:down` 删除。
 */

import { startDatabaseContainer } from "./docker";
import { createVisualPool, waitForDatabase } from "./pool";
import { applyMigrations, resetSchema } from "./reset";
import { seedDatabase } from "./seed";

export interface DatabaseTimings {
  /** 启动（或确认已在运行）容器并等健康检查通过 */
  containerMs: number;
  /** 从 Windows 这边连上数据库 */
  connectMs: number;
  /** 清空旧表并跑迁移 */
  schemaMs: number;
  /** 写种子 */
  seedMs: number;
  totalMs: number;
}

async function timed<T>(action: () => Promise<T>): Promise<[T, number]> {
  const started = Date.now();
  const result = await action();
  return [result, Date.now() - started];
}

export async function prepareDatabase(): Promise<DatabaseTimings> {
  const started = Date.now();
  const [, containerMs] = await timed(startDatabaseContainer);

  const pool = createVisualPool();
  try {
    const [, connectMs] = await timed(() => waitForDatabase(pool));
    const [, schemaMs] = await timed(async () => {
      await resetSchema(pool);
      await applyMigrations(pool);
    });
    const [, seedMs] = await timed(() => seedDatabase(pool));
    return {
      connectMs,
      containerMs,
      schemaMs,
      seedMs,
      totalMs: Date.now() - started,
    };
  } finally {
    await pool.end();
  }
}
