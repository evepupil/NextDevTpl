/**
 * 停掉并删除截图专用数据库容器（`pnpm visual:db:down`）
 *
 * 只删容器和网络，命名卷 nextdevtpl_visual_pg 保留；下次重跑会从头清库重建，卷里没有需要保护的数据。
 * 这是纯 JS 脚本，不经过 Playwright，所以路径换算和 db/docker.ts 里的逻辑各写一份。
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

/** 发行版名称只在 constants.ts 里定义一处，这里直接读出来，避免两边不一致 */
function readWslDistro() {
  const source = readFileSync(
    path.join(repoRoot, "e2e", "visual", "constants.ts"),
    "utf8"
  );
  const match = /VISUAL_WSL_DISTRO\s*=\s*"([^"]+)"/.exec(source);
  if (!match?.[1]) {
    throw new Error("没有在 constants.ts 里找到 VISUAL_WSL_DISTRO");
  }
  return match[1];
}

/** C:\code\NextDevTpl -> /mnt/c/code/NextDevTpl */
function toWslPath(windowsPath) {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(windowsPath);
  if (!match) return windowsPath.replace(/\\/g, "/");
  return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, "/")}`;
}

const composeArgs = [
  "docker",
  "compose",
  "-f",
  "e2e/visual/compose.yaml",
  "down",
];

const isWindows = process.platform === "win32";
const command = isWindows ? "wsl.exe" : composeArgs[0];
const args = isWindows
  ? [
      "-d",
      readWslDistro(),
      "--cd",
      toWslPath(repoRoot),
      "--",
      ...composeArgs,
    ]
  : composeArgs.slice(1);

const result = spawnSync(command, args, { cwd: repoRoot, stdio: "inherit" });
if (result.error) {
  console.error(`截图数据库容器停止失败：${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
