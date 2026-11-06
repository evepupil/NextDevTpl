import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import {
  VISUAL_BASE_URL,
  VISUAL_DATABASE_URL,
  VISUAL_DB,
  VISUAL_SERVER_PORT,
} from "../../visual/constants";
import { VISUAL_AUTH_SECRET } from "../../visual/fixtures";

const SERVER_PORT = VISUAL_SERVER_PORT;
const READY_TIMEOUT_MS = 180_000;
const LOG_TAIL_LINES = 80;

export interface RunningAuthNavigationServer {
  logTail: () => string;
  pid: number;
  stop: () => Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertVisualDatabaseTarget(
  connectionString: string = VISUAL_DATABASE_URL
): void {
  let database: URL;
  try {
    database = new URL(connectionString);
  } catch {
    throw new Error("认证回归的数据库连接串无效。");
  }
  const databaseName = decodeURIComponent(
    database.pathname.replace(/^\//u, "")
  );
  if (
    database.hostname !== VISUAL_DB.host ||
    database.port !== String(VISUAL_DB.port) ||
    databaseName !== VISUAL_DB.database
  ) {
    throw new Error("认证回归只允许使用专用本机 nextdevtpl_visual 数据库。");
  }
}

function processEnvironmentValue(name: string): string | undefined {
  const actualName = Object.keys(process.env).find(
    (candidate) => candidate.toUpperCase() === name.toUpperCase()
  );
  return actualName === undefined ? undefined : process.env[actualName];
}

function buildProductionEnvironment(): NodeJS.ProcessEnv {
  assertVisualDatabaseTarget();
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production" };
  const operatingSystemKeys = [
    "APPDATA",
    "COMSPEC",
    "HOME",
    "HOMEDRIVE",
    "HOMEPATH",
    "LOCALAPPDATA",
    "PATH",
    "PATHEXT",
    "PROGRAMDATA",
    "PROGRAMFILES",
    "SYSTEMDRIVE",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
    "USERPROFILE",
    "WINDIR",
  ];
  for (const key of operatingSystemKeys) {
    const value = processEnvironmentValue(key);
    if (value !== undefined) env[key] = value;
  }

  Object.assign(env, {
    BETTER_AUTH_SECRET: VISUAL_AUTH_SECRET,
    BETTER_AUTH_URL: VISUAL_BASE_URL,
    DATABASE_URL: VISUAL_DATABASE_URL,
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: VISUAL_BASE_URL,
    NEXT_TELEMETRY_DISABLED: "1",
    NO_PROXY: "localhost,127.0.0.1,::1",
    PORT: String(SERVER_PORT),
    RESEND_API_KEY: "",
    TZ: "UTC",
  });
  if (env.NODE_ENV !== "production") {
    throw new Error("认证回归服务器必须以 NODE_ENV=production 启动。");
  }
  if (!env.DATABASE_URL) {
    throw new Error("认证回归服务器缺少专用测试数据库连接。");
  }
  assertVisualDatabaseTarget(env.DATABASE_URL);
  return env;
}

export async function assertAuthNavigationPortFree(): Promise<void> {
  if (await isPortInUse(SERVER_PORT)) {
    throw new Error(`端口 ${SERVER_PORT} 已被占用，认证回归服务器无法启动。`);
  }
}

function isPortInUse(port: number): Promise<boolean> {
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
    ([ipv4, ipv6]) => ipv4 || ipv6
  );
}

function getStatus(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: 5000 }, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode ?? 0));
    });
    request.once("timeout", () => request.destroy(new Error("请求超时")));
    request.once("error", reject);
  });
}

function killProcessTree(pid: number): void {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    // 进程组已退出。
  }
}

async function waitForExit(
  child: ChildProcess,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (child.exitCode === null && child.signalCode === null) {
    if (Date.now() > deadline) return false;
    await sleep(100);
  }
  return true;
}

export async function startAuthNavigationServer(options: {
  logFile: string;
  projectRoot: string;
}): Promise<RunningAuthNavigationServer> {
  const projectRoot = fs.realpathSync(options.projectRoot);
  const nextDirectory = path.join(projectRoot, ".next");
  const buildId = path.join(nextDirectory, "BUILD_ID");
  if (
    fs.lstatSync(nextDirectory).isSymbolicLink() ||
    fs.lstatSync(buildId).isSymbolicLink()
  ) {
    throw new Error("生产构建目录不能是符号链接。");
  }
  await assertAuthNavigationPortFree();

  const nextBin = require.resolve("next/dist/bin/next", {
    paths: [projectRoot],
  });
  fs.mkdirSync(path.dirname(options.logFile), { recursive: true });
  const logStream = fs.createWriteStream(options.logFile, { flags: "w" });
  const tail: string[] = [];
  const child = spawn(
    process.execPath,
    [
      nextBin,
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(SERVER_PORT),
    ],
    {
      cwd: projectRoot,
      detached: process.platform !== "win32",
      env: buildProductionEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }
  );
  const onOutput = (chunk: Buffer) => {
    const text = chunk.toString("utf8");
    logStream.write(text);
    for (const line of text.split(/\r?\n/u)) {
      if (!line.trim()) continue;
      tail.push(line);
      if (tail.length > LOG_TAIL_LINES) tail.shift();
    }
  };
  child.stdout?.on("data", onOutput);
  child.stderr?.on("data", onOutput);

  let launchError: Error | undefined;
  child.once("error", (error) => {
    launchError = error;
  });
  const pid = child.pid;
  if (pid === undefined) {
    logStream.end();
    throw new Error("认证回归服务器进程没有启动成功。");
  }

  const killOnExit = () => killProcessTree(pid);
  process.once("exit", killOnExit);
  const logTail = () => tail.join("\n");
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      killProcessTree(pid);
      if (!(await waitForExit(child, 15_000))) {
        throw new Error(`认证回归服务器未能退出，进程号 ${pid}。`);
      }
    }
    process.off("exit", killOnExit);
    logStream.end();
  };

  const deadline = Date.now() + READY_TIMEOUT_MS;
  try {
    for (;;) {
      if (launchError) throw launchError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(
          `生产服务器提前退出（退出码 ${child.exitCode}）。\n${logTail()}`
        );
      }
      if (Date.now() > deadline) {
        throw new Error(
          `生产服务器 ${READY_TIMEOUT_MS / 1000} 秒内没有就绪。\n${logTail()}`
        );
      }
      try {
        const status = await getStatus(`${VISUAL_BASE_URL}/en/sign-in`);
        if (status === 200) break;
      } catch {
        // 服务器尚未开始监听。
      }
      await sleep(500);
    }
  } catch (error) {
    await stop();
    throw error;
  }

  return { logTail, pid, stop };
}

export async function assertAuthNavigationPortReleased(): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (!(await isPortInUse(SERVER_PORT))) return;
    await sleep(500);
  }
  throw new Error(`认证回归服务器退出后端口 ${SERVER_PORT} 仍被占用。`);
}
