import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { demoEnvironment } from "../e2e/demo/environment.ts";
import { generateProject } from "../packages/create-nextdevtpl/dist/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { values } = parseArgs({
  options: {
    case: { type: "string" },
    keep: { type: "boolean", default: true },
  },
});
const allCases = [
  { name: "demo-default", options: {} },
  {
    name: "demo-contrast",
    options: {
      skin: {
        kind: "local",
        directory: join(repositoryRoot, "tests/fixtures/skins/contrast"),
      },
    },
  },
  { name: "demo-palette", options: { palette: "glassmorphism" } },
];
const cases = allCases.filter((item) => !values.case || values.case === item.name);
if (cases.length === 0) throw new Error("Unknown demo acceptance case");
const root = await mkdtemp(join(tmpdir(), "nextdevtpl-skins-"));
const receiptPath = join(repositoryRoot, "artifacts/skins", `${basename(root)}-demo.json`);
const receipt = { root, retained: true, removed: false, completed: false, projects: {} };
const environment = demoEnvironment();

async function saveReceipt() {
  await mkdir(dirname(receiptPath), { recursive: true });
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

function run(args, cwd) {
  return new Promise((resolveProcess, reject) => {
    const child = spawn("pnpm", args, {
      cwd,
      env: {
        ...environment,
        NODE_ENV: args[0] === "install" ? "development" : args[1] === "test:run" ? "test" : "production",
      },
      stdio: "inherit",
      windowsHide: true,
      shell: process.platform === "win32",
    });
    child.once("error", () => reject(new Error("Demo verification command could not start")));
    child.once("exit", (code) => code === 0 ? resolveProcess() : reject(new Error("Demo verification command failed")));
  });
}

async function filesUnder(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    assert(!entry.isSymbolicLink(), `Unexpected source symlink: ${name}`);
    if (entry.isDirectory()) result.push(...await filesUnder(join(directory, entry.name), name));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}

async function verifyStructure(directory, generated) {
  assert.equal(generated.mode, "demo");
  assert.equal(generated.target, "server");
  assert.deepEqual(generated.modules, []);
  assert.deepEqual(generated.adapters, {});
  assert.deepEqual(generated.bindings, []);
  assert.equal(generated.viewModules.length, 8);
  assert.match(generated.demo.dataSha256, /^[a-f0-9]{64}$/u);
  const pkg = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    assert(!/^(?:@aws-sdk\/|@neondatabase\/|@sentry\/|@upstash\/|@react-email\/|@opennextjs\/|better-auth$|next-safe-action$|drizzle|pg$|ws$|pino|creem$|stripe$|openai$|resend$|nodemailer$|inngest$|wrangler$|@fingerprintjs\/|@next\/third-parties$)/u.test(name), `Backend dependency remains: ${name}`);
  }
  for (const [name, command] of Object.entries(pkg.scripts)) {
    assert(!/db:|cf:|migrat|telemetry/iu.test(name), `Backend script remains: ${name}`);
    assert(!/drizzle|wrangler|check-health|verify-production-health/iu.test(command), `Backend command remains: ${name}`);
  }
  const rootFiles = await readdir(directory);
  assert(!rootFiles.some((name) => /^\.env(?:$|\.)/u.test(name) && name !== ".env.example"), "Real environment file remains");
  const envExample = await readFile(join(directory, ".env.example"), "utf8");
  assert(!/^\s*[A-Z_][A-Z0-9_]*\s*=/mu.test(envExample), "Demo requires environment variables");
  const sourceFiles = await filesUnder(join(directory, "src"));
  const expectedRoutes = [
    "app/[locale]/(marketing)/page.tsx",
    "app/[locale]/(marketing)/legal/[slug]/page.tsx",
    "app/[locale]/(marketing)/blog/page.tsx",
    "app/[locale]/(marketing)/blog/[slug]/page.tsx",
    "app/[locale]/(marketing)/pseo/page.tsx",
    "app/[locale]/(marketing)/pseo/[slug]/page.tsx",
    ...["sign-in", "sign-up", "forgot-password", "reset-password"].map((route) => `app/[locale]/(auth)/${route}/page.tsx`),
    ...["", "/credits", "/credits/buy", "/settings", "/support", "/support/new", "/support/[id]"].map((route) => `app/[locale]/(dashboard)/dashboard${route}/page.tsx`),
  ];
  assert.deepEqual(sourceFiles.filter((file) => file.startsWith("app/") && file.endsWith("/page.tsx")).sort(), expectedRoutes.sort(), "Demo must contain exactly the 17 registered user routes");
  for (const name of sourceFiles) {
    assert(!/^(?:app\/api\/|db\/|adapters\/|services\/)/u.test(name), `Backend source remains: ${name}`);
    assert(!/^app\/\[locale\]\/\((?:admin)\)\//u.test(name), `Admin route remains: ${name}`);
    assert(!/^features\/[^/]+\/(?:actions|server|repositories)\//u.test(name), `Live implementation remains: ${name}`);
    if (/\.[cm]?[jt]sx?$/u.test(name)) {
      const source = await readFile(join(directory, "src", name), "utf8");
      assert(!/^\s*["']use server["'];?/mu.test(source), `Server Action remains: ${name}`);
      assert(!/(?:from\s*|import\s*\()["'](?:@\/(?:db|services|adapters|lib\/auth)(?:\/|["'])|(?:better-auth|next-safe-action|drizzle-orm|@neondatabase\/|@aws-sdk\/))/u.test(source), `Backend import remains: ${name}`);
    }
  }
  return { sourceFiles: sourceFiles.length, dependencies: Object.keys(pkg.dependencies).length };
}

try {
  await saveReceipt();
  for (const item of cases) {
    const directory = join(root, item.name);
    const project = { directory, status: "running", currentStep: "generate", steps: [] };
    receipt.projects[item.name] = project;
    await saveReceipt();
    const generated = await generateProject({
      targetDirectory: directory,
      mode: "demo",
      target: "server",
      install: false,
      ...item.options,
    });
    const manifest = generated.manifest;
    Object.assign(project, { mode: manifest.mode, viewModules: manifest.viewModules, skin: manifest.skin, demo: manifest.demo });
    project.structure = await verifyStructure(directory, manifest);
    project.steps.push("structure");
    for (const [step, args] of [
      ["install", ["install", "--frozen-lockfile", "--prefer-offline", "--ignore-workspace"]],
      ["lint", ["run", "lint"]],
      ["typecheck", ["run", "typecheck"]],
      ["smoke", ["run", "test:run"]],
      ["build", ["run", "build"]],
    ]) {
      project.currentStep = step;
      await saveReceipt();
      await run(args, directory);
      project.steps.push(step);
    }
    project.status = "passed";
    delete project.currentStep;
    await saveReceipt();
  }
  receipt.completed = true;
} catch (error) {
  const active = Object.values(receipt.projects).find((project) => project.status === "running");
  if (active) active.status = "failed";
  throw error;
} finally {
  await saveReceipt();
  process.stdout.write(`Demo projects retained for browser acceptance. Receipt: ${receiptPath}\n`);
}
