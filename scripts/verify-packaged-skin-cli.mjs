// Run with: node --experimental-strip-types scripts/verify-packaged-skin-cli.mjs
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { parseEnv } from "node:util";
import { tmpdir } from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  VISUAL_BASE_URL,
  VISUAL_DATABASE_URL,
} from "../e2e/visual/constants.ts";
import { VISUAL_AUTH_SECRET } from "../e2e/visual/fixtures.ts";
import { demoEnvironment } from "../e2e/demo/environment.ts";
import { redact } from "./compatibility/process.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = join(repositoryRoot, "packages", "create-nextdevtpl");
const artifactDirectory = join(
  repositoryRoot,
  "artifacts",
  "skins",
  "packaged-cli"
);
const tokenSentinel = "nextdevtpl-default-skin-token-sentinel";
const extraArguments = process.argv.slice(2);
function parseArguments(args) {
  let mode = "full";
  let modeSeen = false;
  let paletteId;
  let paletteSeen = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--mode") {
      if (modeSeen) throw new Error("Duplicate --mode option");
      modeSeen = true;
      mode = args[index + 1];
      index += 1;
    } else if (argument === "--palette") {
      if (paletteSeen) throw new Error("Duplicate --palette option");
      paletteSeen = true;
      paletteId = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown packaged CLI verification option: ${argument}`);
    }
  }
  if (mode !== "full" && mode !== "demo") {
    throw new Error("Packaged CLI mode must be full or demo");
  }
  if (
    paletteSeen &&
    (!paletteId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(paletteId))
  ) {
    throw new Error("Invalid packaged palette verification argument");
  }
  return { mode, paletteId };
}
const { mode, paletteId } = parseArguments(extraArguments);
const runId = randomUUID();
const receiptPath = join(artifactDirectory, `${runId}.json`);
const receipt = {
  runId,
  mode,
  palette: paletteId ?? null,
  status: "running",
  runnerRemoved: false,
  timingsMs: {},
  checks: [],
};

function recordCheck(name) {
  receipt.checks.push(name);
}

function makeEnvironment(source, blockedNames, additions = {}) {
  const blocked = new Set([...blockedNames].map((name) => name.toUpperCase()));
  const environment = { ...source };
  for (const name of Object.keys(environment)) {
    if (blocked.has(name.toUpperCase())) delete environment[name];
  }
  for (const [name, value] of Object.entries(additions)) {
    for (const existing of Object.keys(environment)) {
      if (existing.toUpperCase() === name.toUpperCase()) {
        delete environment[existing];
      }
    }
    environment[name] = value;
  }
  return environment;
}

function run(command, args, options) {
  const startedAt = performance.now();
  const environment = options.env ?? process.env;
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: environment,
      shell: process.platform === "win32" && !isAbsolute(command),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let processStartFailed = false;
    let settled = false;
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", () => {
      processStartFailed = true;
    });
    child.once("close", (code) => {
      if (settled) return;
      settled = true;
      if (processStartFailed) {
        reject(new Error(`${options.label} could not be started`));
        return;
      }
      const durationMs = Math.round(performance.now() - startedAt);
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8");
      if (code !== 0) {
        const safeStdout = redact(stdoutText, environment);
        const safeStderr = redact(stderrText, environment);
        if (safeStdout) process.stdout.write(safeStdout);
        if (safeStderr) process.stderr.write(safeStderr);
        reject(new Error(`${options.label} failed with exit code ${code}`));
        return;
      }
      if (options.capture) {
        resolvePromise({
          durationMs,
          stdout: stdoutText,
          stderr: stderrText,
        });
        return;
      }
      const safeStdout = redact(stdoutText, environment);
      const safeStderr = redact(stderrText, environment);
      if (safeStdout) process.stdout.write(safeStdout);
      if (safeStderr) process.stderr.write(safeStderr);
      resolvePromise({
        durationMs,
        stdout: safeStdout,
        stderr: safeStderr,
      });
    });
  });
}

async function runStep(label, command, args, options) {
  process.stdout.write(`\nPackaged skin CLI: ${label}\n`);
  const result = await run(command, args, { ...options, label });
  receipt.timingsMs[label] = result.durationMs;
  return result;
}

async function listFiles(root, relativeRoot = "") {
  const files = [];
  for (const name of await readdir(join(root, relativeRoot))) {
    const relativePath = relativeRoot ? join(relativeRoot, name) : name;
    if (relativePath === "node_modules" || relativePath.startsWith(`node_modules${sep}`)) {
      continue;
    }
    const absolutePath = join(root, relativePath);
    const stat = await lstat(absolutePath);
    if (stat.isSymbolicLink()) {
      throw new Error("Generated project contains a symbolic link");
    }
    if (stat.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
    } else if (stat.isFile()) {
      files.push(relativePath.split(sep).join("/"));
    }
  }
  return files;
}

function isWithin(parent, candidate) {
  const child = relative(resolve(parent), resolve(candidate));
  return child === "" || (!child.startsWith(`..${sep}`) && child !== "..");
}

async function assertNoRepositoryPath(projectRoot, sensitiveValues) {
  const variants = new Set([
    repositoryRoot,
    repositoryRoot.replaceAll("\\", "/"),
    repositoryRoot.replaceAll("/", "\\"),
  ].map((value) => value.toLowerCase()));
  for (const path of await listFiles(projectRoot)) {
    if (path.startsWith("node_modules/")) continue;
    const content = await readFile(join(projectRoot, ...path.split("/")));
    if (content.includes(0)) continue;
    const text = content.toString("utf8").toLowerCase();
    for (const variant of variants) {
      if (text.includes(variant)) {
        throw new Error("Generated project contains a repository path");
      }
    }
    if (sensitiveValues.some((value) => text.includes(value.toLowerCase()))) {
      throw new Error("Generated project contains a credential value");
    }
  }
}

async function assertPackContents(files) {
  const names = files.map(({ path }) => path.replaceAll("\\", "/"));
  if (
    names.some((name) =>
      /(^|\/)(?:src\/)?test\//iu.test(name) ||
      /(?:localhost-(?:key|cert)|testcertificate|\.pem$|\.p12$|\.key$)/iu.test(
        name
      )
    )
  ) {
    throw new Error("Package contains test fixtures or certificate material");
  }
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

const forbiddenDemoDependencyPatterns = [
  /^@aws-sdk\//u,
  /^@neondatabase\//u,
  /^@sentry\//u,
  /^@upstash\//u,
  /^@react-email\//u,
  /^@opennextjs\//u,
  /^@fingerprintjs\//u,
  /^@next\/third-parties$/u,
  /^better-auth$/u,
  /^next-safe-action$/u,
  /^drizzle/u,
  /^pg$/u,
  /^ws$/u,
  /^pino/u,
  /^creem$/u,
  /^stripe$/u,
  /^openai$/u,
  /^resend$/u,
  /^nodemailer$/u,
  /^inngest$/u,
  /^wrangler$/u,
];

async function assertDemoProject(projectRoot, packageJson, generated) {
  if (
    generated.mode !== "demo" ||
    generated.target !== "server" ||
    generated.preset !== "custom" ||
    generated.modules?.length !== 0 ||
    Object.keys(generated.adapters ?? {}).length !== 0 ||
    generated.bindings?.length !== 0 ||
    generated.viewModules?.length !== 8 ||
    !/^[a-f0-9]{64}$/u.test(generated.demo?.dataSha256 ?? "")
  ) {
    throw new Error("Packaged demo manifest is incomplete");
  }
  recordCheck("demo-mode-manifest-and-eight-view-modules");

  const environment = parseEnv(
    await readFile(join(projectRoot, ".env.example"), "utf8")
  );
  if (Object.keys(environment).length > 0) {
    throw new Error("Packaged demo requires business environment variables");
  }
  recordCheck("demo-has-no-business-environment");

  const forbiddenPaths = [
    "src/app/api",
    "src/app/[locale]/(admin)",
    "src/app/[locale]/docs",
    "src/adapters",
    "src/db",
    "src/services",
    "src/lib/health",
    "drizzle",
    "drizzle.config.ts",
    "deploy/check-health.mjs",
    "deploy/verify-production-health.mjs",
    "deploy/server/build.sh",
    "deploy/docker",
    "deploy/vercel",
    "Dockerfile",
    "compose.yaml",
    "vercel.json",
    "open-next.config.ts",
    "wrangler.jsonc",
    "cloudflare",
  ];
  for (const path of forbiddenPaths) {
    if (await pathExists(join(projectRoot, path))) {
      throw new Error(`Packaged demo retained backend path: ${path}`);
    }
  }
  if (!(await pathExists(join(projectRoot, "deploy", "server", "start.sh")))) {
    throw new Error("Packaged demo is missing its server startup script");
  }
  recordCheck("demo-retains-server-startup-only");

  const scripts = Object.entries(packageJson.scripts ?? {});
  if (
    scripts.some(
      ([name, command]) =>
        /db:|cf:|migrat|telemetry/iu.test(name) ||
        /drizzle|wrangler|check-health|verify-production-health/iu.test(command)
    )
  ) {
    throw new Error("Packaged demo retained a backend-only script");
  }
  const dependencies = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  });
  const backendDependency = dependencies.find((name) =>
    forbiddenDemoDependencyPatterns.some((pattern) => pattern.test(name))
  );
  if (backendDependency) {
    throw new Error(`Packaged demo retained backend dependency: ${backendDependency}`);
  }
  recordCheck("demo-has-no-backend-scripts-or-dependencies");
}

async function assertGeneratedProject(
  projectRoot,
  packageDirectory,
  sensitiveValues
) {
  const packageJson = JSON.parse(
    await readFile(join(projectRoot, "package.json"), "utf8")
  );
  const generated = JSON.parse(
    await readFile(join(projectRoot, "nextdevtpl.generated.json"), "utf8")
  );
  if (mode === "demo") {
    await assertDemoProject(projectRoot, packageJson, generated);
  }
  const sourceSkinDirectory = join(packageDirectory, "template", "src", "skin");
  const sourceSkin = JSON.parse(
    await readFile(join(sourceSkinDirectory, "skin.json"), "utf8")
  );
  const { calculateSkinPackageHash } = await import(
    pathToFileURL(join(packageDirectory, "dist", "skins", "hash.js")).href
  );
  const expectedPackageHash = await calculateSkinPackageHash(
    sourceSkinDirectory,
    sourceSkin
  );
  if (
    generated.skin?.id !== sourceSkin.id ||
    generated.skin?.version !== sourceSkin.version ||
    generated.skin?.packageHash !== expectedPackageHash ||
    generated.skin?.source?.kind !== "builtin" ||
    generated.skin?.source?.id !== "default"
  ) {
    throw new Error("Generated manifest does not record the packaged default skin");
  }
  recordCheck("builtin-skin-manifest");
  if (paletteId) {
    if (
      generated.skin.palette?.provider !== "stylekit" ||
      generated.skin.palette?.id !== paletteId ||
      !/^[a-f0-9]{64}$/u.test(generated.skin.palette?.sourceSha256 ?? "")
    ) {
      throw new Error("Packaged palette metadata is missing");
    }
    const notice = await readFile(join(projectRoot, "STYLEKIT-LICENSE.txt"), "utf8");
    if (!notice.includes(paletteId) || !notice.includes("AnxForever") || !notice.includes("MIT License")) {
      throw new Error("Packaged palette license is incomplete");
    }
    if ((await readdir(projectRoot)).includes("palettes")) {
      throw new Error("Generated project contains unselected palette resources");
    }
    recordCheck("packaged-palette-and-notice");
  }

  const outputSkinDirectory = join(projectRoot, "src", "skin");
  const outputSkin = JSON.parse(
    await readFile(join(outputSkinDirectory, "skin.json"), "utf8")
  );
  const selectedViewModules =
    mode === "demo" ? generated.viewModules : generated.modules;
  const skinFiles = (await listFiles(outputSkinDirectory)).sort();
  const declaredSkinFiles = [...Object.keys(outputSkin.files), "skin.json"].sort();
  if (
    JSON.stringify(skinFiles) !== JSON.stringify(declaredSkinFiles) ||
    !Array.isArray(selectedViewModules) ||
    Object.keys(outputSkin.viewEntries).some(
      (moduleName) => !selectedViewModules.includes(moduleName)
    )
  ) {
    throw new Error("Generated skin contains undeclared or unselected files");
  }
  recordCheck("selected-skin-files");

  if (
    !packageJson.scripts ||
    !(await lstat(join(projectRoot, "node_modules")).then(
      (stat) => stat.isDirectory(),
      () => false
    )) ||
    !(await lstat(join(projectRoot, "pnpm-lock.yaml")).then(
      (stat) => stat.isFile(),
      () => false
    ))
  ) {
    throw new Error("Default dependency installation did not complete");
  }
  if (mode === "full") {
    const migrations = await listFiles(join(projectRoot, "drizzle")).catch(
      () => []
    );
    if (!migrations.some((path) => path.endsWith(".sql"))) {
      throw new Error("Initial database migration was not generated");
    }
    recordCheck("default-install-and-migration");
  } else {
    recordCheck("demo-skips-database-migration-and-health");
  }

  const projectFiles = await listFiles(projectRoot);
  if (
    projectFiles.some((path) =>
      /^(?:src\/test\/skins\/|tests\/|e2e\/|src\/test\/fixtures\/)/iu.test(
        path
      )
    )
  ) {
    throw new Error("Generated project contains repository test fixtures");
  }
  await assertNoRepositoryPath(projectRoot, sensitiveValues);
  recordCheck("no-repository-paths-or-token");
}

let runnerDirectory;
let runnerTempRoot;
let runnerIdentity;
let finalError;

function isAuthorizedRunnerDirectory(path) {
  if (!runnerTempRoot) return false;
  const candidate = resolve(path);
  return (
    candidate !== runnerTempRoot &&
    dirname(candidate) === runnerTempRoot &&
    isWithin(runnerTempRoot, candidate) &&
    !isWithin(repositoryRoot, candidate) &&
    !isWithin(candidate, repositoryRoot)
  );
}

function retainRunnerDirectory(reason) {
  receipt.runnerRemoved = false;
  receipt.runnerCleanup = { status: "retained", reason };
  process.stderr.write(`Packaged CLI runner cleanup skipped: ${reason}\n`);
}

async function cleanupRunnerDirectory() {
  if (!runnerDirectory) {
    receipt.runnerCleanup = { status: "not-created" };
    return;
  }
  if (!runnerIdentity || !isAuthorizedRunnerDirectory(runnerDirectory)) {
    retainRunnerDirectory("runner identity or temporary-directory authorization is missing");
    return;
  }

  let currentIdentity;
  try {
    currentIdentity = await lstat(runnerDirectory, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      receipt.runnerRemoved = true;
      receipt.runnerCleanup = { status: "already-absent" };
      return;
    }
    retainRunnerDirectory("runner directory identity could not be checked");
    return;
  }
  if (
    currentIdentity.isSymbolicLink() ||
    !currentIdentity.isDirectory()
  ) {
    retainRunnerDirectory("runner path is no longer a plain directory");
    return;
  }
  if (
    currentIdentity.dev !== runnerIdentity.dev ||
    currentIdentity.ino !== runnerIdentity.ino
  ) {
    retainRunnerDirectory("runner directory identity changed");
    return;
  }

  try {
    await rm(runnerDirectory, { recursive: true, force: true });
    receipt.runnerRemoved = true;
    receipt.runnerCleanup = { status: "removed" };
  } catch {
    retainRunnerDirectory("runner directory could not be removed");
  }
}

try {
  let databaseUrl;
  if (mode === "full") {
    databaseUrl = new URL(VISUAL_DATABASE_URL);
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(databaseUrl.hostname)) {
      throw new Error("Packaged CLI acceptance requires the local visual database");
    }
  }

  runnerTempRoot = resolve(tmpdir());
  runnerDirectory = await mkdtemp(
    join(runnerTempRoot, "nextdevtpl-packaged-cli-")
  );
  receipt.runnerDirectory = runnerDirectory;
  const createdRunnerStat = await lstat(runnerDirectory, { bigint: true });
  if (createdRunnerStat.isSymbolicLink() || !createdRunnerStat.isDirectory()) {
    throw new Error("Temporary runner must be a plain directory");
  }
  runnerIdentity = { dev: createdRunnerStat.dev, ino: createdRunnerStat.ino };
  receipt.runnerIdentity = {
    dev: createdRunnerStat.dev.toString(),
    ino: createdRunnerStat.ino.toString(),
  };
  if (!isAuthorizedRunnerDirectory(runnerDirectory)) {
    throw new Error(
      "Temporary runner must remain in the authorized temp directory outside the repository"
    );
  }
  await writeFile(
    join(runnerDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "nextdevtpl-skin-cli-runner",
        private: true,
        version: "0.0.0",
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  const sourcePackage = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8")
  );
  const templateRoot = join(packageRoot, "template");
  const envExample = parseEnv(
    await readFile(join(templateRoot, ".env.example"), "utf8")
  );
  const catalog = JSON.parse(
    await readFile(join(packageRoot, "catalog.json"), "utf8")
  );
  const knownEnvironmentNames = new Set([
    ...Object.keys(envExample),
    ...Object.values(catalog.modules).flatMap((module) => module.env),
    ...Object.values(catalog.adapters).flatMap((adapter) => adapter.env),
    "NODE_ENV",
    "NEXTDEVTPL_SKIN_TOKEN",
  ]);
  const projectEnvironment =
    mode === "demo"
      ? demoEnvironment()
      : makeEnvironment(process.env, knownEnvironmentNames, {
          DATABASE_URL: databaseUrl.href,
          NEXTDEVTPL_ALLOW_REMOTE_TEST_DATABASE: "0",
          BETTER_AUTH_SECRET: VISUAL_AUTH_SECRET,
          BETTER_AUTH_URL: VISUAL_BASE_URL,
          NEXT_PUBLIC_APP_URL: VISUAL_BASE_URL,
          APP_VERSION: "packaged-skin-cli",
          NEXT_TELEMETRY_DISABLED: "1",
          CI: "1",
          NO_PROXY: "localhost,127.0.0.1,::1",
          no_proxy: "localhost,127.0.0.1,::1",
          NEXTDEVTPL_SKIN_TOKEN: tokenSentinel,
        });
  const packageEnvironment = makeEnvironment(process.env, knownEnvironmentNames, {
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "1",
  });

  const packed = await runStep(
    "npm-pack",
    "npm",
    [
      "pack",
      "--ignore-scripts",
      "--json",
      "--pack-destination",
      runnerDirectory,
      packageRoot,
    ],
    { cwd: repositoryRoot, env: packageEnvironment, capture: true }
  );
  const packRecord = JSON.parse(packed.stdout)[0];
  if (!packRecord?.filename || !Array.isArray(packRecord.files)) {
    throw new Error("npm pack did not return its package file list");
  }
  await assertPackContents(packRecord.files);
  recordCheck("tarball-excludes-tests-and-certificates");

  const tarballPath = join(runnerDirectory, packRecord.filename);
  const installDirectory = join(runnerDirectory, "package-runner");
  await mkdir(installDirectory);
  await writeFile(
    join(installDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "nextdevtpl-skin-cli-install-runner",
        private: true,
        type: "module",
        version: "0.0.0",
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await runStep(
    "npm-install-package",
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarballPath,
    ],
    { cwd: installDirectory, env: packageEnvironment }
  );

  const packageDirectory = join(
    installDirectory,
    "node_modules",
    sourcePackage.name
  );
  const cliPath = join(packageDirectory, "dist", "cli.js");
  if (!isWithin(runnerDirectory, packageDirectory)) {
    throw new Error("Installed generator escaped the owned runner directory");
  }
  const projectDirectory = join(
    runnerDirectory,
    mode === "demo" ? "generated-demo" : "generated-minimal"
  );
  const cliArguments =
    mode === "demo"
      ? [
          cliPath,
          projectDirectory,
          "--mode",
          "demo",
          ...(paletteId ? ["--palette", paletteId] : []),
        ]
      : [
          cliPath,
          projectDirectory,
          "--preset",
          "minimal",
          ...(paletteId ? ["--palette", paletteId] : []),
        ];
  const generationCheck =
    mode === "demo"
      ? "generate-demo"
      : "generate-default-install-and-migration";
  const generation = await runStep(
    generationCheck,
    process.execPath,
    cliArguments,
    { cwd: runnerDirectory, env: projectEnvironment }
  );
  receipt.timingsMs[generationCheck] = generation.durationMs;
  const sensitiveValues =
    mode === "full"
      ? [tokenSentinel, VISUAL_AUTH_SECRET, databaseUrl.password].filter(Boolean)
      : [];
  await assertGeneratedProject(
    projectDirectory,
    packageDirectory,
    sensitiveValues
  );

  for (const [name, args] of [
    ["lint", ["run", "lint"]],
    ["typecheck", ["run", "typecheck"]],
    ["smoke", ["run", "test:run"]],
  ]) {
    const stepEnvironment =
      mode === "demo"
        ? {
            ...demoEnvironment(),
            NODE_ENV: name === "smoke" ? "test" : "production",
          }
        : packageEnvironment;
    await runStep(name, "pnpm", args, {
      cwd: projectDirectory,
      env: stepEnvironment,
    });
    recordCheck(name);
  }
  if (mode === "demo") {
    await runStep(
      "production-build",
      "pnpm",
      ["run", "build"],
      {
        cwd: projectDirectory,
        env: { ...demoEnvironment(), NODE_ENV: "production" },
      }
    );
    recordCheck("production-build");
  }
  receipt.status = "passed";
} catch (error) {
  finalError = error instanceof Error ? error.message : "Acceptance failed";
  receipt.status = "failed";
} finally {
  await cleanupRunnerDirectory();
  await mkdir(artifactDirectory, { recursive: true });
  if (finalError) receipt.error = finalError;
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

process.stdout.write(`Packaged skin CLI receipt: ${relative(repositoryRoot, receiptPath)}\n`);
if (finalError) process.exitCode = 1;
