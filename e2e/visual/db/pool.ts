/**
 * 截图数据库的连接池和等待就绪
 */

import { Pool } from "pg";

import { VISUAL_DATABASE_URL } from "../constants";

export function createVisualPool(): Pool {
  return new Pool({ connectionString: VISUAL_DATABASE_URL, max: 4 });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 等数据库能从 Windows 这边连上
 *
 * 容器内部健康检查通过后，WSL 把端口转发到 Windows 还会有一小段延迟，
 * 所以这里反复尝试，而不是只信任容器的健康状态。
 */
export async function waitForDatabase(
  pool: Pool,
  timeoutMs = 60_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await pool.query("select 1");
      return;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }
  const reason = lastError instanceof Error ? lastError.message : "未知原因";
  throw new Error(
    `等待 ${timeoutMs / 1000} 秒后仍连不上截图数据库（127.0.0.1:15470）：${reason}`
  );
}
