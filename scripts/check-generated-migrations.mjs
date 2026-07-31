import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";

try {
  await access("drizzle/meta");
} catch {
  throw new Error("drizzle/meta is missing; generate migrations first");
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const executable =
  process.platform === "win32"
    ? process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe"
    : command;
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", command, "exec", "biome", "check", "--no-errors-on-unmatched", "drizzle/meta"]
    : ["exec", "biome", "check", "--no-errors-on-unmatched", "drizzle/meta"];
const result = spawnSync(
  executable,
  args,
  { stdio: "inherit" }
);

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
}
