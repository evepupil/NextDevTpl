import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

import { generateProject } from "../packages/create-nextdevtpl/dist/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(repositoryRoot, ".env.test"), quiet: true });
const requestedCases = process.env.NEXTDEVTPL_VERIFY_PRESETS?.split(",").filter(
  Boolean
);
const verificationCases = [
  { name: "minimal", options: { preset: "minimal" } },
  { name: "saas", options: { preset: "saas" } },
  {
    name: "saas-docker",
    options: { preset: "saas", target: "docker" },
  },
  { name: "ai-saas", options: { preset: "ai-saas" } },
  {
    name: "custom",
    options: {
      preset: "custom",
      modules: ["auth", "dashboard", "storage"],
      target: "server",
      adapterOverrides: {
        mail: "mail:smtp",
        storage: "storage:s3-compatible",
        "rate-limit": "rate-limit:noop",
      },
    },
  },
];

function run(command, args, cwd) {
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
          ["/d", "/s", "/c", command, ...args],
          { cwd, stdio: "inherit" }
        )
      : spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    const detail = result.error ? `: ${result.error.message}` : "";
    throw new Error(
      `${command} ${args.join(" ")} failed in ${cwd}${detail}`
    );
  }
}

const root = await mkdtemp(join(tmpdir(), "nextdevtpl-presets-"));
try {
  for (const verification of verificationCases) {
    if (requestedCases && !requestedCases.includes(verification.name)) continue;
    const target = join(root, verification.name);
    process.stdout.write(`\nVerifying generated preset: ${verification.name}\n`);
    const { manifest } = await generateProject({
      targetDirectory: target,
      ...verification.options,
      install: false,
    });
    run(
      "pnpm",
      ["install", "--frozen-lockfile", "--prefer-offline"],
      target
    );
    run("pnpm", ["db:generate:init"], target);
    run("pnpm", ["lint"], target);
    run("pnpm", ["typecheck"], target);
    run("pnpm", ["test:run"], target);
    run("pnpm", ["build"], target);
    if (manifest.target !== "cloudflare") {
      run("pnpm", ["verify:health"], target);
    }
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
