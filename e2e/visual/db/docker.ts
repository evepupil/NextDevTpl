/**
 * 经 WSL 调用 Docker，启动 / 停止截图专用数据库容器
 *
 * 本机规矩：Docker 只在 WSL 里跑，Windows 这边的 Node 通过 wsl.exe 转发命令。
 * 用 spawn 传参数组而不是拼字符串，这样路径里的 /mnt/... 不会被 Git Bash 改写。
 */

import { spawn } from "node:child_process";
import path from "node:path";

import { VISUAL_WSL_DISTRO } from "../constants";
import { COMPOSE_FILE_RELATIVE, REPO_ROOT } from "../paths";

export interface CommandResult {
  code: number | null;
  stderr: string;
  stdout: string;
}

/**
 * 把 Windows 路径换算成 WSL 里的 /mnt/<盘符>/... 路径
 * 例：C:\code\NextDevTpl -> /mnt/c/code/NextDevTpl
 */
export function toWslPath(windowsPath: string): string {
  const resolved = path.resolve(windowsPath);
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(resolved);
  if (!match) {
    // 本来就是 POSIX 路径（在 Linux 上直接运行）
    return resolved.replace(/\\/g, "/");
  }
  const drive = (match[1] ?? "").toLowerCase();
  const rest = (match[2] ?? "").replace(/\\/g, "/");
  return `/mnt/${drive}/${rest}`;
}

/** wsl.exe 自己的提示是 UTF-16，容器内命令的输出是 UTF-8，统一去掉空字符再展示 */
function cleanOutput(buffer: Buffer): string {
  return buffer.toString("utf8").replaceAll("\u0000", "");
}

/**
 * 在仓库根目录执行 docker 命令
 * Windows 下走 `wsl.exe -d <发行版> --cd <仓库> -- docker ...`
 */
export function runDocker(
  args: readonly string[],
  options: { timeoutMs?: number } = {}
): Promise<CommandResult> {
  const timeoutMs = options.timeoutMs ?? 180_000;
  const isWindows = process.platform === "win32";
  const command = isWindows ? "wsl.exe" : "docker";
  const commandArgs = isWindows
    ? [
        "-d",
        VISUAL_WSL_DISTRO,
        "--cd",
        toWslPath(REPO_ROOT),
        "--",
        "docker",
        ...args,
      ]
    : [...args];

  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `docker ${args.join(" ")} 超过 ${timeoutMs / 1000} 秒仍未结束`
        )
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stderr: cleanOutput(Buffer.concat(stderr)),
        stdout: cleanOutput(Buffer.concat(stdout)),
      });
    });
  });
}

/** docker compose 的公共参数：固定使用截图专用的编排文件 */
function composeArgs(...rest: string[]): string[] {
  return ["compose", "-f", COMPOSE_FILE_RELATIVE, ...rest];
}

/**
 * 启动数据库容器并等到健康检查通过
 * 容器已经在运行时 compose 会直接返回，所以重复调用是安全的。
 */
export async function startDatabaseContainer(): Promise<void> {
  const result = await runDocker(
    composeArgs("up", "-d", "--wait", "--wait-timeout", "120")
  );
  if (result.code !== 0) {
    throw new Error(
      [
        "截图数据库容器启动失败。请确认 WSL 里的 Docker 正在运行，",
        "并且 127.0.0.1:15470 没有被别的程序占用。",
        result.stderr.trim() || result.stdout.trim(),
      ].join("\n")
    );
  }
}

/** 停掉并删除数据库容器，保留命名卷（`pnpm visual:db:down` 有同样逻辑的纯 JS 版本） */
export async function stopDatabaseContainer(): Promise<void> {
  const result = await runDocker(composeArgs("down"));
  if (result.code !== 0) {
    throw new Error(
      `截图数据库容器停止失败：${result.stderr.trim() || result.stdout.trim()}`
    );
  }
}
