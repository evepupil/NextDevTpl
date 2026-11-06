/**
 * 全局准备：每次运行前执行一次
 *
 * 顺序：重建数据库 -> 启动截图服务器 -> 校验服务端时间已平移 -> 登录保存会话 -> 预热全部页面
 * 任何一步失败都会先把已启动的服务器关掉再抛错，不留残余进程。
 */

import { VISUAL_BASE_URL, VISUAL_NOW, VISUAL_USER } from "./constants";
import { createVisualPool } from "./db/pool";
import { prepareDatabase } from "./db/prepare";
import { rememberServer, takeServer, writeRunInfo } from "./run-state";
import { fetchServerClock, startDevServer } from "./server/dev-server";
import { buildServerEnv } from "./server/env";
import { signInAndSaveState } from "./server/sign-in";
import { type WarmupResult, warmUpPages } from "./server/warmup";

/** 服务端时间允许比 VISUAL_NOW 晚多少：从计算偏移量到服务器就绪之间真实流逝的时间 */
const MAX_CLOCK_DRIFT_MS = 10 * 60_000;

function log(message: string): void {
  console.log(`[visual] ${message}`);
}

/** 服务端“现在”必须从 VISUAL_NOW 附近开始走，否则说明时间平移没有生效 */
async function assertServerClockShifted(): Promise<void> {
  const serverNow = await fetchServerClock();
  const drift = serverNow - Date.parse(VISUAL_NOW);
  if (drift < 0 || drift > MAX_CLOCK_DRIFT_MS) {
    throw new Error(
      `服务端时间平移没有生效：服务端现在是 ${new Date(serverNow).toISOString()}，` +
        `应该在 ${VISUAL_NOW} 之后 ${MAX_CLOCK_DRIFT_MS / 60_000} 分钟之内`
    );
  }
  log(
    `服务端时间 ${new Date(serverNow).toISOString()}（已平移到 ${VISUAL_NOW} 附近）`
  );
}

/**
 * 页面访问不应该改写种子数据。
 * 重点防两件事：用户没有交易记录时会懒发 200 注册积分；积分账户缺失时会自动补建。
 */
async function assertSeedUntouched(): Promise<void> {
  const pool = createVisualPool();
  try {
    const { rows } = await pool.query<{
      balance: number;
      transactions: number;
    }>(
      `select
         (select count(*)::int from credits_transaction where user_id = $1) as transactions,
         (select balance from credits_balance where user_id = $1) as balance`,
      [VISUAL_USER.id]
    );
    const row = rows[0];
    if (row?.transactions !== 12 || row.balance !== 2480) {
      throw new Error(
        `预热之后种子数据被改写了：交易 ${row?.transactions} 条（应为 12），余额 ${row?.balance}（应为 2480）`
      );
    }
  } finally {
    await pool.end();
  }
}

function summarizeWarmup(result: WarmupResult): void {
  const firstVisits = result.timings
    .filter((timing) => timing.locale === "en")
    .map((timing) => timing.ms);
  const otherVisits = result.timings
    .filter((timing) => timing.locale !== "en")
    .map((timing) => timing.ms);
  const range = (values: number[]) =>
    values.length === 0
      ? "无"
      : `${Math.min(...values)} ~ ${Math.max(...values)} ms`;
  log(`预热首次访问（en）每页耗时范围 ${range(firstVisits)}`);
  log(`预热再次访问（zh）每页耗时范围 ${range(otherVisits)}`);
  for (const timing of result.timings) {
    log(`  ${timing.locale}-${timing.id}: ${timing.ms} ms`);
  }
  for (const warning of result.warnings) {
    log(`预热警告 ${warning}`);
  }
}

export default async function globalSetup(): Promise<void> {
  const totalStarted = Date.now();

  log("准备截图数据库（容器 -> 清库 -> 迁移 -> 种子）...");
  const database = await prepareDatabase();
  log(
    `数据库就绪，用时 ${database.totalMs} ms ` +
      `（容器 ${database.containerMs}，连接 ${database.connectMs}，` +
      `清库迁移 ${database.schemaMs}，种子 ${database.seedMs}）`
  );

  // 服务端时间平移量只算一次，传给服务器的全部子进程
  const timeOffsetMs = Date.parse(VISUAL_NOW) - Date.now();
  const { blankedKeys, env, fixedKeys } = buildServerEnv(timeOffsetMs);
  log(
    `服务器环境变量：固定值 ${fixedKeys.length} 个，显式置空 ${blankedKeys.length} 个`
  );

  const serverStarted = Date.now();
  const server = await startDevServer(env);
  rememberServer(server);
  const coldStartMs = Date.now() - serverStarted;
  log(
    `服务器就绪 ${VISUAL_BASE_URL}（进程号 ${server.pid}），冷启动 ${coldStartMs} ms` +
      (server.readyInMs === undefined
        ? ""
        : `，Next 自报 Ready in ${server.readyInMs} ms`)
  );

  try {
    await assertServerClockShifted();
    await signInAndSaveState();
    log("截图账号登录成功，会话已保存");

    const warmupStarted = Date.now();
    const warmup = await warmUpPages();
    log(`预热完成，用时 ${Date.now() - warmupStarted} ms`);
    summarizeWarmup(warmup);

    await assertSeedUntouched();
    writeRunInfo({
      edgeVersion: warmup.edgeVersion,
      serverPid: server.pid,
      startedAt: new Date().toISOString(),
    });
    log(`全局准备完成，共 ${Date.now() - totalStarted} ms`);
  } catch (error) {
    await takeServer()?.stop();
    throw error;
  }
}
