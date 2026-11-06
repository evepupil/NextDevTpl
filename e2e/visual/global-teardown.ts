/**
 * 全局收尾：关掉截图服务器（连进程树一起）
 *
 * 数据库容器故意保留，下次运行可以直接复用；要删除用 `pnpm visual:db:down`。
 */

import { VISUAL_SERVER_PORT } from "./constants";
import { readRunInfo, takeServer } from "./run-state";
import { isPortInUse } from "./server/dev-server";

function log(message: string): void {
  console.log(`[visual] ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function globalTeardown(): Promise<void> {
  const server = takeServer();
  if (server) {
    await server.stop();
    log(`截图服务器已关闭（进程号 ${server.pid}）`);
  } else {
    log("没有找到本次运行启动的服务器句柄，跳过关闭");
  }

  // 端口释放可能比进程退出晚一点
  for (let attempt = 0; attempt < 20; attempt++) {
    if (!(await isPortInUse(VISUAL_SERVER_PORT))) {
      log(`端口 ${VISUAL_SERVER_PORT} 已释放`);
      return;
    }
    await sleep(500);
  }
  const pid = readRunInfo()?.serverPid;
  log(
    `警告：端口 ${VISUAL_SERVER_PORT} 仍被占用` +
      (pid === undefined ? "" : `，可尝试 taskkill /PID ${pid} /T /F`)
  );
}
