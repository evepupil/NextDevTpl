import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

import {
  VISUAL_BASE_URL,
  VISUAL_DATABASE_URL,
  VISUAL_WSL_DISTRO,
} from "../e2e/visual/constants.ts";
import { VISUAL_AUTH_SECRET } from "../e2e/visual/fixtures.ts";

import {
  generateProject,
  loadCatalog,
} from "../packages/create-nextdevtpl/dist/index.js";
import {
  applySkinPackage,
  validateSkinPackage,
} from "../packages/create-nextdevtpl/dist/skins/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = join(repositoryRoot, "tests", "fixtures", "skins", "contrast");
const catalog = await loadCatalog(join(repositoryRoot, "recipes", "catalog.json"));
const keep = process.argv.includes("--keep");
const requestedCases = process.env.NEXTDEVTPL_VERIFY_SKIN_PRESETS?.split(",").filter(
  Boolean
);
const cases = [
  { name: "minimal", options: { preset: "minimal" } },
  { name: "saas", options: { preset: "saas" } },
  { name: "ai-saas", options: { preset: "ai-saas" } },
  {
    name: "no-dashboard",
    options: {
      preset: "custom",
      modules: ["auth", "settings", "support"],
      adapterOverrides: {
        payment: "payment:creem",
        storage: "storage:s3-compatible",
      },
    },
  },
  {
    name: "full-server",
    options: {
      preset: "custom",
      modules: Object.keys(catalog.modules),
      target: "server",
      adapterOverrides: {
        payment: "payment:creem",
        storage: "storage:s3-compatible",
        mail: "mail:disabled",
        ai: "ai:openai-compatible",
        jobs: "jobs:inngest",
        "rate-limit": "rate-limit:noop",
      },
    },
  },
];
if (
  requestedCases &&
  (requestedCases.length === 0 ||
    requestedCases.some((name) => !cases.some((item) => item.name === name)))
) {
  throw new Error("Unknown or empty skin verification case selection");
}

const database = new URL(VISUAL_DATABASE_URL);
if (!["127.0.0.1", "localhost", "[::1]"].includes(database.hostname)) {
  throw new Error("Skin verification requires the local test database");
}
const commandEnv = { ...process.env };
function setEnvironment(name, value) {
  const keys = Object.keys(commandEnv).filter(
    (key) => key.toUpperCase() === name.toUpperCase()
  );
  for (const key of keys.length > 0 ? keys : [name]) commandEnv[key] = value;
}
const knownEnvironment = new Set([
  ...Object.keys(parseEnv(await readFile(join(repositoryRoot, ".env.example"), "utf8"))),
  ...Object.values(catalog.modules).flatMap((module) => module.env),
  ...Object.values(catalog.adapters).flatMap((adapter) => adapter.env),
]);
for (const name of knownEnvironment) setEnvironment(name, "");
for (const [name, value] of Object.entries({
  DATABASE_URL: database.href,
  NEXTDEVTPL_ALLOW_REMOTE_TEST_DATABASE: "0",
  BETTER_AUTH_SECRET: VISUAL_AUTH_SECRET,
  BETTER_AUTH_URL: VISUAL_BASE_URL,
  NEXT_PUBLIC_APP_URL: VISUAL_BASE_URL,
  NEXT_TELEMETRY_DISABLED: "1",
  NO_PROXY: "localhost,127.0.0.1,::1",
})) {
  setEnvironment(name, value);
}

function run(args, cwd) {
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
          ["/d", "/s", "/c", "pnpm", ...args],
          { cwd, env: commandEnv, stdio: "inherit", windowsHide: true }
        )
      : spawnSync("pnpm", args, { cwd, env: commandEnv, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Skin project check failed: pnpm ${args.join(" ")}`);
  }
}

const root = await mkdtemp(join(tmpdir(), "nextdevtpl-skins-"));
const projects = {};
const receipt = join(repositoryRoot, "artifacts", "skins", "projects.json");
const runReceipt = join(dirname(receipt), `${basename(root)}.json`);
let completed = false;
let removed = false;
let activeProject;
async function saveReceipt() {
  const contents = `${JSON.stringify(
    { root, retained: keep && !removed, removed, completed, projects },
    null,
    2
  )}\n`;
  await mkdir(dirname(receipt), { recursive: true });
  await writeFile(receipt, contents);
  await writeFile(runReceipt, contents);
}
try {
  await saveReceipt();
  const dockerArgs = [
    "compose", "-f", "e2e/visual/compose.yaml",
    "up", "-d", "--wait", "--wait-timeout", "120",
  ];
  const docker = process.platform === "win32"
    ? spawnSync("wsl.exe", [
        "-d", VISUAL_WSL_DISTRO, "--cd",
        repositoryRoot.replace(/^([A-Za-z]):/u, (_, drive) => `/mnt/${drive.toLowerCase()}`).replaceAll("\\", "/"),
        "--", "docker", ...dockerArgs,
      ], { cwd: repositoryRoot, stdio: "inherit", windowsHide: true, timeout: 180_000 })
    : spawnSync("docker", dockerArgs, { cwd: repositoryRoot, stdio: "inherit", timeout: 180_000 });
  if (docker.status !== 0) throw new Error("Local acceptance database did not start");
  for (const item of cases) {
    if (requestedCases && !requestedCases.includes(item.name)) continue;
    const targetDirectory = join(root, item.name);
    activeProject = {
      directory: targetDirectory,
      status: "running",
      currentStep: "generate",
      steps: [],
    };
    projects[item.name] = activeProject;
    await saveReceipt();
    process.stdout.write(`\nVerifying contrast skin: ${item.name}\n`);
    const { manifest } = await generateProject({
      targetDirectory,
      ...item.options,
      install: false,
    });
    if (item.name === "full-server" && manifest.modules.length !== Object.keys(catalog.modules).length) {
      throw new Error("Full skin acceptance must include every module");
    }
    if (item.name === "no-dashboard" && manifest.modules.includes("dashboard")) {
      throw new Error("The no-dashboard case must exclude the dashboard module");
    }
    activeProject.modules = manifest.modules;
    activeProject.currentStep = "validate";
    const skin = await validateSkinPackage({
      directory,
      templateDirectory: repositoryRoot,
      catalog,
      selectedModules: manifest.modules,
    });
    activeProject.currentStep = "apply";
    await applySkinPackage({
      skin,
      targetDirectory,
      catalog,
      selectedModules: manifest.modules,
    });
    activeProject.packageHash = skin.packageHash;
    activeProject.target = manifest.target;

    const steps = [
      ["install", ["install", "--frozen-lockfile", "--prefer-offline"]],
      ["migration", ["db:generate:init"]],
      ["lint", ["lint"]],
      ["typecheck", ["typecheck"]],
      ["test", ["test:run"]],
      ["build", ["build"]],
      ...(manifest.target !== "cloudflare" ? [["health", ["verify:health"]]] : []),
    ];
    for (const [name, args] of steps) {
      activeProject.currentStep = name;
      await saveReceipt();
      run(args, targetDirectory);
      activeProject.steps.push(name);
    }
    delete activeProject.currentStep;
    activeProject.status = "passed";
    await saveReceipt();
  }
  completed = true;
} catch (error) {
  if (activeProject) activeProject.status = "failed";
  throw error;
} finally {
  if (!keep) {
    await rm(root, { recursive: true, force: true });
    removed = true;
  }
  await saveReceipt();
}
