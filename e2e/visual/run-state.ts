/**
 * 一次运行内需要共享的状态
 *
 * global-setup 起了服务器，global-teardown 要关掉它；清单生成器要知道 Edge 的版本。
 * 它们都跑在 Playwright 的主进程里，内存里放一份服务器句柄；同时写一份 JSON 到磁盘，
 * 这样即使上一次运行被强行终止，也能从文件里找到遗留的服务器进程号。
 */

import fs from "node:fs";
import path from "node:path";

import { RUN_INFO_FILE } from "./paths";
import type { RunningDevServer } from "./server/dev-server";

export interface RunInfo {
  edgeVersion: string;
  /** 截图服务器的进程号 */
  serverPid: number;
  startedAt: string;
}

let runningServer: RunningDevServer | undefined;

export function rememberServer(server: RunningDevServer): void {
  runningServer = server;
}

export function takeServer(): RunningDevServer | undefined {
  const server = runningServer;
  runningServer = undefined;
  return server;
}

export function writeRunInfo(info: RunInfo): void {
  fs.mkdirSync(path.dirname(RUN_INFO_FILE), { recursive: true });
  fs.writeFileSync(RUN_INFO_FILE, `${JSON.stringify(info, null, 2)}\n`);
}

export function readRunInfo(): RunInfo | undefined {
  try {
    return JSON.parse(fs.readFileSync(RUN_INFO_FILE, "utf8")) as RunInfo;
  } catch {
    return undefined;
  }
}
