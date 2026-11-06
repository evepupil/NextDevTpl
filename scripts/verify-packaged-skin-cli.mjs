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

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = join(repositoryRoot, "packages", "create-nextdevtpl");
const artifactDirectory = join(
  repositoryRoot,
  "artifacts",
  "skins",
  "packaged-cli"
);
const tokenSentinel = "nextdevtpl-default-skin-token-sentinel";
const runId = randomUUID();
const receiptPath = join(artifactDirectory, `${runId}.json`);
const receipt = {
  runId,
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
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: process.platform === "win32" && !isAbsolute(command),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => {
      if (options.capture) stdout.push(chunk);
      else process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      if (options.capture) stderr.push(chunk);
      else process.stderr.write(chunk);
    });
    child.once("error", () => {
      reject(new Error(`${options.label} could not be started`));
    });
    child.once("exit", (code) => {
      const durationMs = Math.round(performance.now() - startedAt);
      if (code !== 0) {
        reject(new Error(`${options.label} failed with exit code ${code}`));
        return;
      }
      resolvePromise({
        durationMs,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
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

  const outputSkinDirectory = join(projectRoot, "src", "skin");
  const outputSkin = JSON.parse(
    await readFile(join(outputSkinDirectory, "skin.json"), "utf8")
  );
  const skinFiles = (await listFiles(outputSkinDirectory)).sort();
  const declaredSkinFiles = [...Object.keys(outputSkin.files), "skin.json"].sort();
  if (
    JSON.stringify(skinFiles) !== JSON.stringify(declaredSkinFiles) ||
    Object.keys(outputSkin.viewEntries).some(
      (moduleName) => !generated.modules.includes(moduleName)
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
  const migrations = await listFiles(join(projectRoot, "drizzle")).catch(
    () => []
  );
  if (!migrations.some((path) => path.endsWith(".sql"))) {
    throw new Error("Initial database migration was not generated");
  }
  recordCheck("default-install-and-migration");

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
let finalError;

try {
  const databaseUrl = new URL(VISUAL_DATABASE_URL);
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(databaseUrl.hostname)) {
    throw new Error("Packaged CLI acceptance requires the local visual database");
  }

  runnerDirectory = await mkdtemp(join(tmpdir(), "nextdevtpl-packaged-cli-"));
  if (
    isWithin(repositoryRoot, runnerDirectory) ||
    isWithin(runnerDirectory, repositoryRoot)
  ) {
    throw new Error("Temporary runner must remain outside the repository path");
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
  const projectEnvironment = makeEnvironment(process.env, knownEnvironmentNames, {
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
  const projectDirectory = join(runnerDirectory, "generated-minimal");
  if (!isWithin(runnerDirectory, packageDirectory)) {
    throw new Error("Installed generator escaped the owned runner directory");
  }
  const generation = await runStep(
    "generate-default-install-and-migration",
    process.execPath,
    [cliPath, projectDirectory, "--preset", "minimal"],
    { cwd: runnerDirectory, env: projectEnvironment }
  );
  receipt.timingsMs.defaultInstallAndMigration = generation.durationMs;
  await assertGeneratedProject(projectDirectory, packageDirectory, [
    tokenSentinel,
    VISUAL_AUTH_SECRET,
    databaseUrl.password,
  ].filter(Boolean));

  for (const [name, args] of [
    ["lint", ["run", "lint"]],
    ["typecheck", ["run", "typecheck"]],
    ["smoke", ["run", "test:run"]],
  ]) {
    await runStep(name, "pnpm", args, {
      cwd: projectDirectory,
      env: packageEnvironment,
    });
    recordCheck(name);
  }
  receipt.status = "passed";
} catch (error) {
  finalError = error instanceof Error ? error.message : "Acceptance failed";
  receipt.status = "failed";
} finally {
  if (runnerDirectory) {
    await rm(runnerDirectory, { recursive: true, force: true });
    receipt.runnerRemoved = true;
  }
  await mkdir(artifactDirectory, { recursive: true });
  if (finalError) receipt.error = finalError;
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

process.stdout.write(`Packaged skin CLI receipt: ${relative(repositoryRoot, receiptPath)}\n`);
if (finalError) process.exitCode = 1;
