import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { VISUAL_BASE_URL, VISUAL_SERVER_PORT } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { demoEnvironment } from "./environment";
import { demoProject } from "./project";

export default async function setup() {
  const selected = demoProject();
  if (!fs.existsSync(path.join(selected.directory, ".next/BUILD_ID"))) {
    throw new Error("演示项目必须先完成生产构建。");
  }
  try {
    await fetch(`${VISUAL_BASE_URL}/en/sign-in`, {
      signal: AbortSignal.timeout(1000),
    });
    throw new Error("验收端口已占用。");
  } catch (error) {
    if (error instanceof Error && error.message === "验收端口已占用。")
      throw error;
  }
  const require = createRequire(path.join(selected.directory, "package.json"));
  const nextBin = require.resolve("next/dist/bin/next");
  const logPath = path.join(
    REPO_ROOT,
    "artifacts/demo",
    path.basename(selected.directory),
    "server.log"
  );
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const log = fs.createWriteStream(logPath);
  const child = spawn(
    process.execPath,
    [
      nextBin,
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(VISUAL_SERVER_PORT),
    ],
    {
      cwd: selected.directory,
      env: { ...demoEnvironment(), NODE_ENV: "production" },
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }
  );
  child.stdout?.pipe(log);
  child.stderr?.pipe(log);
  let launchError: Error | undefined;
  child.once("error", (error) => {
    launchError = error;
  });
  const kill = () => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null)
      return;
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        /* 已退出。 */
      }
    }
  };
  const stop = async () => {
    kill();
    const deadline = Date.now() + 15_000;
    while (child.exitCode === null && child.signalCode === null) {
      if (Date.now() > deadline) throw new Error("演示生产服务器没有退出。");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    process.off("exit", kill);
    log.end();
  };
  process.once("exit", kill);
  const deadline = Date.now() + 180_000;
  try {
    for (;;) {
      if (launchError) throw launchError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error("演示生产服务器提前退出，请查看 server.log。");
      }
      if (Date.now() > deadline) throw new Error("演示生产服务器启动超时。");
      try {
        const response = await fetch(`${VISUAL_BASE_URL}/en/sign-in`, {
          signal: AbortSignal.timeout(2000),
        });
        await response.arrayBuffer();
        if (response.status === 200) break;
      } catch {
        /* 等待进程开始监听。 */
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } catch (error) {
    await stop();
    throw error;
  }
  return stop;
}
