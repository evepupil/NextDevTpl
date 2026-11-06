/**
 * 截图专用 Next 开发服务器的启动与关闭
 *
 * 启动前的三道检查（任何一道不过都给出明确提示，不做破坏性操作）：
 * 1. 日常开发的 `pnpm dev` 是否在跑：读 .next/dev/lock（Next 开发服务器写的锁文件，内容是 JSON，
 *    含进程号和端口），进程还活着就直接报错，一个文件都不删；
 * 2. 端口 3100 是否被占用；
 * 3. 删除 .next/dev，避免沿用日常开发时按另一套环境变量编出的产物。
 *
 * 关闭时用 taskkill /T /F 连进程树一起结束，Turbopack 的子进程不会残留。
 */

import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

import { VISUAL_BASE_URL, VISUAL_SERVER_PORT } from "../constants";
import { NEXT_DEV_DIR, REPO_ROOT, SERVER_LOG_FILE } from "../paths";

const LOCK_FILE = path.join(NEXT_DEV_DIR, "lock");
const READY_TIMEOUT_MS = 240_000;
const LOG_TAIL_LINES = 60;

/** Next 开发服务器已经在运行时，它自己打印的提示 */
const ALREADY_RUNNING_MARKER = "Another next dev server is already running";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// 启动前检查
// ---------------------------------------------------------------------------

interface DevServerLock {
  pid?: number;
  port?: number;
}

/** 读取 Next 开发服务器的锁文件；不存在或内容不是 JSON 时返回 undefined */
function readDevServerLock(): DevServerLock | undefined {
  let content: string;
  try {
    content = fs.readFileSync(LOCK_FILE, "utf8");
  } catch {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const record = parsed as Record<string, unknown>;
    const lock: DevServerLock = {};
    if (typeof record.pid === "number") lock.pid = record.pid;
    if (typeof record.port === "number") lock.port = record.port;
    return lock;
  } catch {
    return undefined;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM 表示进程存在但没有权限发信号，也算活着
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/**
 * 进程是不是 node：进程号可能被系统回收后分给别的程序，
 * 锁文件里的旧进程号如果已经不是 node，说明服务器早就死了，锁文件是残留的。
 * 查不出来时按“是 node”处理，宁可多报错也不去误删正在使用的目录。
 */
function isNodeProcess(pid: number): boolean {
  if (process.platform === "win32") {
    const result = spawnSync(
      "tasklist",
      ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"],
      { encoding: "utf8", windowsHide: true }
    );
    if (result.status !== 0) return true;
    const imageName = /^"([^"]+)"/.exec(result.stdout.trim())?.[1];
    return imageName === undefined || /^node(\.exe)?$/i.test(imageName);
  }
  const result = spawnSync("ps", ["-p", String(pid), "-o", "comm="], {
    encoding: "utf8",
  });
  if (result.status !== 0) return true;
  return /node/i.test(result.stdout);
}

/** 日常开发服务器占着 .next/dev 时直接报错，什么都不删 */
function assertNoRunningDevServer(): void {
  const lock = readDevServerLock();
  if (!lock?.pid) return;
  if (!isProcessAlive(lock.pid) || !isNodeProcess(lock.pid)) return;

  const port = lock.port ?? "未知";
  if (lock.port === VISUAL_SERVER_PORT) {
    throw new Error(
      `上一次截图遗留的开发服务器还在运行（进程号 ${lock.pid}，端口 ${port}）。` +
        `先结束它再重跑：taskkill /PID ${lock.pid} /T /F`
    );
  }
  throw new Error(
    `发现正在运行的 Next 开发服务器（进程号 ${lock.pid}，端口 ${port}）。` +
      `先停掉 pnpm dev（端口 ${port}）再跑截图；` +
      "两个开发服务器不能同时使用 .next/dev。"
  );
}

/** 端口上有程序在监听就返回 true（IPv4、IPv6 都试一遍） */
export function isPortInUse(port: number): Promise<boolean> {
  const probe = (host: string) =>
    new Promise<boolean>((resolve) => {
      const socket = net.connect({ host, port });
      const finish = (inUse: boolean) => {
        socket.destroy();
        resolve(inUse);
      };
      socket.setTimeout(1000, () => finish(false));
      socket.once("connect", () => finish(true));
      socket.once("error", () => finish(false));
    });
  return Promise.all([probe("127.0.0.1"), probe("::1")]).then(
    ([v4, v6]) => v4 || v6
  );
}

async function assertPortFree(port: number): Promise<void> {
  if (await isPortInUse(port)) {
    throw new Error(
      `端口 ${port} 已被占用，截图服务器无法启动。先停掉占用它的程序再跑截图。`
    );
  }
}

/** 删除 .next/dev；删不掉说明有进程占着文件，同样提示先停掉开发服务器 */
function removeNextDevDir(): void {
  try {
    fs.rmSync(NEXT_DEV_DIR, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 300,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `无法清理 ${NEXT_DEV_DIR}，可能有开发服务器正在使用它。` +
        `先停掉 pnpm dev 再跑截图。原因：${reason}`
    );
  }
}

// ---------------------------------------------------------------------------
// 就绪探测
// ---------------------------------------------------------------------------

/** 用 node:http 发 GET，不经过环境里的代理设置 */
export function httpGetJson(
  url: string,
  timeoutMs = 10_000
): Promise<{ body: unknown; status: number }> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        try {
          resolve({
            body: text ? (JSON.parse(text) as unknown) : null,
            status: response.statusCode ?? 0,
          });
        } catch {
          resolve({ body: text, status: response.statusCode ?? 0 });
        }
      });
    });
    request.on("timeout", () => request.destroy(new Error("请求超时")));
    request.on("error", reject);
  });
}

/** 服务端健康接口返回的服务端当前时间，用来验证时间平移是否生效 */
export async function fetchServerClock(): Promise<number> {
  const { body, status } = await httpGetJson(
    `${VISUAL_BASE_URL}/api/health?mode=live`
  );
  const timestamp =
    typeof body === "object" && body !== null
      ? (body as { timestamp?: unknown }).timestamp
      : undefined;
  if (status !== 200 || typeof timestamp !== "string") {
    throw new Error(`健康接口返回异常：HTTP ${status}`);
  }
  return Date.parse(timestamp);
}

// ---------------------------------------------------------------------------
// 启动与关闭
// ---------------------------------------------------------------------------

export interface RunningDevServer {
  /** 最近的服务端日志，失败时附在报错里 */
  logTail: () => string;
  pid: number;
  /** Next 自己打印的 Ready in 耗时（毫秒），没解析到时为 undefined */
  readyInMs: number | undefined;
  stop: () => Promise<void>;
}

function killProcessTree(pid: number): void {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    // 进程组已经不存在
  }
}

async function waitForExit(child: ChildProcess, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (child.exitCode === null && child.signalCode === null) {
    if (Date.now() > deadline) return;
    await sleep(100);
  }
}

export async function startDevServer(
  env: NodeJS.ProcessEnv
): Promise<RunningDevServer> {
  assertNoRunningDevServer();
  await assertPortFree(VISUAL_SERVER_PORT);
  removeNextDevDir();

  fs.mkdirSync(path.dirname(SERVER_LOG_FILE), { recursive: true });
  const logStream = fs.createWriteStream(SERVER_LOG_FILE, { flags: "w" });
  const tail: string[] = [];
  let readyInMs: number | undefined;
  let sawAlreadyRunning = false;

  const onOutput = (chunk: Buffer) => {
    const text = chunk.toString("utf8");
    logStream.write(text);
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      tail.push(line);
      if (tail.length > LOG_TAIL_LINES) tail.shift();
      if (line.includes(ALREADY_RUNNING_MARKER)) sawAlreadyRunning = true;
      const ready = /Ready in ([\d.]+)\s*(ms|s)\b/.exec(line);
      if (ready?.[1] && ready[2]) {
        readyInMs = Math.round(
          Number(ready[1]) * (ready[2] === "s" ? 1000 : 1)
        );
      }
    }
  };

  // 直接用 node 执行 next 的入口脚本，不经过 pnpm / .cmd 外壳，
  // 这样 child.pid 就是 node 进程本身，关闭时才能准确杀掉整棵进程树。
  const nextBin = require.resolve("next/dist/bin/next", { paths: [REPO_ROOT] });
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--turbopack", "--port", String(VISUAL_SERVER_PORT)],
    {
      cwd: REPO_ROOT,
      detached: process.platform !== "win32",
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }
  );
  child.stdout?.on("data", onOutput);
  child.stderr?.on("data", onOutput);

  let exited = false;
  child.once("exit", () => {
    exited = true;
  });

  const pid = child.pid;
  if (pid === undefined) {
    logStream.end();
    throw new Error("截图服务器进程没有启动成功");
  }

  // 兜底：主进程意外退出时同步结束服务器进程树，避免遗留进程占着端口
  const killOnExit = () => killProcessTree(pid);
  process.once("exit", killOnExit);

  const logTail = () => tail.join("\n");
  const stop = async () => {
    process.off("exit", killOnExit);
    if (!exited) {
      killProcessTree(pid);
      await waitForExit(child, 15_000);
    }
    logStream.end();
  };

  // 等健康接口返回 200；期间如果进程退出或提示已有开发服务器，立刻报错
  const deadline = Date.now() + READY_TIMEOUT_MS;
  try {
    for (;;) {
      if (sawAlreadyRunning) {
        throw new Error(
          "先停掉 pnpm dev 再跑截图：Next 提示已有开发服务器在使用 .next/dev。\n" +
            logTail()
        );
      }
      if (exited) {
        throw new Error(
          `截图服务器在启动阶段提前退出（退出码 ${child.exitCode}）。\n${logTail()}`
        );
      }
      if (Date.now() > deadline) {
        throw new Error(
          `截图服务器 ${READY_TIMEOUT_MS / 1000} 秒内没有就绪。\n${logTail()}`
        );
      }
      try {
        const { status } = await httpGetJson(
          `${VISUAL_BASE_URL}/api/health?mode=live`,
          5000
        );
        if (status === 200) break;
      } catch {
        // 端口还没开始监听，继续等
      }
      await sleep(500);
    }
  } catch (error) {
    await stop();
    throw error;
  }

  return { logTail, pid, readyInMs, stop };
}
