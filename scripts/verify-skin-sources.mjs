// Run with: node --experimental-strip-types scripts/verify-skin-sources.mjs
import { createHash } from "node:crypto";
import { createServer } from "node:https";
import {
  access,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { parseEnv } from "node:util";

import {
  VISUAL_BASE_URL,
  VISUAL_DATABASE_URL,
} from "../e2e/visual/constants.ts";
import { VISUAL_AUTH_SECRET } from "../e2e/visual/fixtures.ts";
import {
  findGeneratorAssets,
  generateProject,
  loadCatalog,
} from "../packages/create-nextdevtpl/dist/index.js";
import { refreshSkinFileHashes } from "../packages/create-nextdevtpl/dist/skins/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactDirectory = join(repositoryRoot, "artifacts", "skins");
const temporaryPrefix = "nextdevtpl-skins-";
const fixtureDirectory = join(
  repositoryRoot,
  "tests",
  "fixtures",
  "skins",
  "contrast"
);
const privateMarkerName = ".m3-skin-source-run.json";
const caseNames = [
  ...["minimal", "saas", "ai-saas"].flatMap((preset) =>
    ["builtin", "local", "remote"].map((source) => `${preset}-${source}`)
  ),
  "dependency-no-install",
  "no-dashboard-local",
  "auth-only-local",
];

function parseArguments(args) {
  const selectedCases = [];
  let keep = false;
  let cleanRunId;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--keep") {
      keep = true;
    } else if (argument === "--case") {
      const name = args[index + 1];
      if (!name || name.startsWith("--")) {
        throw new Error("Missing value for --case");
      }
      selectedCases.push(name);
      index += 1;
    } else if (argument.startsWith("--case=")) {
      selectedCases.push(argument.slice("--case=".length));
    } else if (argument === "--clean") {
      const runId = args[index + 1];
      if (!runId || runId.startsWith("--")) {
        throw new Error("Missing value for --clean");
      }
      cleanRunId = runId;
      index += 1;
    } else {
      throw new Error("Unknown option");
    }
  }
  if (cleanRunId && (keep || selectedCases.length > 0)) {
    throw new Error("--clean cannot be combined with generation options");
  }
  if (
    selectedCases.some((name) => !caseNames.includes(name)) ||
    new Set(selectedCases).size !== selectedCases.length
  ) {
    throw new Error("Unknown or duplicate acceptance case");
  }
  return { cleanRunId, keep, selectedCases };
}

const cli = parseArguments(process.argv.slice(2));

function runIdFromDirectory(path) {
  const name = basename(path);
  if (!name.startsWith(temporaryPrefix)) {
    throw new Error("Acceptance artifact directory is not owned by this script");
  }
  return name.slice(temporaryPrefix.length);
}

async function readReceipt(runId) {
  if (!/^[A-Za-z0-9-]+$/u.test(runId)) {
    throw new Error("Invalid acceptance run id");
  }
  return JSON.parse(
    await readFile(join(artifactDirectory, `${runId}.json`), "utf8")
  );
}

async function cleanRun(runId) {
  const receipt = await readReceipt(runId);
  const root = resolve(receipt.root);
  const temporaryRoot = resolve(tmpdir());
  if (
    dirname(root) !== temporaryRoot ||
    runIdFromDirectory(root) !== runId
  ) {
    throw new Error("Acceptance receipt does not name an owned temporary directory");
  }
  const rootStat = await lstat(root).catch(() => null);
  if (!rootStat) {
    receipt.removed = true;
  } else {
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
      throw new Error("Acceptance artifact directory changed; cleanup stopped");
    }
    const marker = JSON.parse(
      await readFile(join(root, privateMarkerName), "utf8")
    );
    if (marker.runId !== runId) {
      throw new Error("Acceptance artifact ownership check failed");
    }
    await rm(root, { recursive: true, force: true });
    receipt.removed = true;
  }
  receipt.retained = false;
  await saveReceipt(runId, receipt);
  process.stdout.write(`Cleaned acceptance artifacts for ${runId}\n`);
}

async function saveReceipt(runId, receipt) {
  await mkdir(artifactDirectory, { recursive: true });
  const contents = `${JSON.stringify(receipt, null, 2)}\n`;
  for (const receiptPath of [
    join(artifactDirectory, `${runId}.json`),
    join(artifactDirectory, "projects.json"),
  ]) {
    const temporaryPath = `${receiptPath}.tmp`;
    await writeFile(temporaryPath, contents, "utf8");
    await rename(temporaryPath, receiptPath);
  }
}

if (cli.cleanRunId) {
  await cleanRun(cli.cleanRunId);
  process.exit(0);
}

const selectedCases =
  cli.selectedCases.length > 0 ? cli.selectedCases : caseNames;
async function fail(error) {
  const message = error instanceof Error ? error.message : "Acceptance run failed";
  return message
    .replace(/\b(?:authorization|proxy-authorization)\s*[:=]\s*[^\r\n]+/giu, "authorization: [redacted]")
    .replace(/\bhttps?:\/\/[^\s"'<>]+/giu, "[redacted URL]");
}

const databaseUrl = new URL(VISUAL_DATABASE_URL);
if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(databaseUrl.hostname)) {
  throw new Error("Skin source acceptance requires the local visual database");
}

const assets = await findGeneratorAssets();
const catalog = await loadCatalog(join(repositoryRoot, "recipes", "catalog.json"), {
  templateRoot: assets.templateRoot,
});
const knownProjectEnvironment = new Set([
  ...Object.keys(
    parseEnv(await readFile(join(repositoryRoot, ".env.example"), "utf8"))
  ),
  ...Object.values(catalog.modules).flatMap((module) => module.env),
  ...Object.values(catalog.adapters).flatMap((adapter) => adapter.env),
  "NODE_ENV",
  "NEXTDEVTPL_SKIN_TOKEN",
]);
function makeChildEnvironment(sourceEnvironment = process.env) {
  const environment = { ...sourceEnvironment };
  for (const name of Object.keys(environment)) {
    if (
      [...knownProjectEnvironment].some(
        (known) => known.toUpperCase() === name.toUpperCase()
      )
    ) {
      delete environment[name];
    }
  }
  const set = (name, value) => {
    for (const key of Object.keys(environment)) {
      if (key.toUpperCase() === name.toUpperCase()) delete environment[key];
    }
    environment[name] = value;
  };
  for (const [name, value] of Object.entries({
    DATABASE_URL: databaseUrl.href,
    NEXTDEVTPL_ALLOW_REMOTE_TEST_DATABASE: "0",
    BETTER_AUTH_SECRET: VISUAL_AUTH_SECRET,
    BETTER_AUTH_URL: VISUAL_BASE_URL,
    NEXT_PUBLIC_APP_URL: VISUAL_BASE_URL,
    APP_VERSION: "m3-skin-sources",
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "1",
    NO_PROXY: "localhost,127.0.0.1,::1",
    no_proxy: "localhost,127.0.0.1,::1",
  })) {
    set(name, value);
  }
  return environment;
}

const childEnvironment = makeChildEnvironment();

const requireGeneratorPackage = createRequire(
  new URL("../packages/create-nextdevtpl/package.json", import.meta.url)
);
const tar = requireGeneratorPackage("tar-stream");
const yaml = requireGeneratorPackage("yaml");

const runDirectory = await mkdtemp(join(tmpdir(), temporaryPrefix));
const runId = runIdFromDirectory(runDirectory);
const receipt = {
  runId,
  root: runDirectory,
  retained: cli.keep,
  removed: false,
  completed: false,
  status: "running",
  projects: {},
};
let httpsServer;
let remoteSource;
let workspaceSnapshot;
let finalError;
const runStartedAt = performance.now();

async function buildSkinArchive(directory) {
  const manifest = JSON.parse(
    await readFile(join(directory, "skin.json"), "utf8")
  );
  const paths = ["skin.json", ...Object.keys(manifest.files)].sort();
  const pack = tar.pack();
  const chunks = [];
  const drain = (async () => {
    for await (const chunk of pack) chunks.push(Buffer.from(chunk));
  })();
  for (const path of paths) {
    const body = await readFile(join(directory, ...path.split("/")));
    await new Promise((resolveEntry, rejectEntry) => {
      pack.entry({ name: path, type: "file" }, body, (error) =>
        error ? rejectEntry(error) : resolveEntry()
      );
    });
  }
  pack.finalize();
  await drain;
  const archive = gzipSync(Buffer.concat(chunks));
  return {
    archive,
    sha256: createHash("sha256").update(archive).digest("hex"),
  };
}

async function startLocalHttpsFixture(archive) {
      const [key, cert] = await Promise.all([
    readFile(join(repositoryRoot, "src/test/skins/fixtures/localhost-key.pem")),
    readFile(join(repositoryRoot, "src/test/skins/fixtures/localhost-cert.pem")),
  ]);
  const server = createServer({ key, cert }, (request, response) => {
    if (request.url !== "/skin.tgz") {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      "content-length": archive.byteLength,
      "content-type": "application/gzip",
    });
    response.end(archive);
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not bind the local HTTPS skin fixture");
  }
  return {
    ca: cert,
    url: `https://127.0.0.1:${address.port}/skin.tgz`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose()))
      );
    },
  };
}

function runProcess(command, args, cwd, inheritedEnvironment = childEnvironment) {
  const safeEnvironment = makeChildEnvironment(inheritedEnvironment);
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(command, [...args], {
      cwd,
      env: safeEnvironment,
      stdio: "inherit",
      windowsHide: true,
      shell: process.platform === "win32",
    });
    child.once("error", rejectProcess);
    child.once("exit", (code) => {
      if (code === 0) resolveProcess();
      else rejectProcess(new Error(`${command} exited with ${code}`));
    });
  });
}

async function runStep(project, name, command, args) {
  project.currentStep = name;
  await saveReceipt(runId, receipt);
  const startedAt = performance.now();
  try {
    await runProcess(command, args, project.directory);
    project.steps.push({
      name,
      status: "passed",
      durationMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    project.steps.push({
      name,
      status: "failed",
      durationMs: Math.round(performance.now() - startedAt),
      error: await fail(error),
    });
    project.status = "failed";
    throw error;
  } finally {
    delete project.currentStep;
    await saveReceipt(runId, receipt);
  }
}

async function prepareDependencySkin(directory) {
  await cp(fixtureDirectory, directory, { recursive: true, errorOnExist: true });
  const manifestPath = join(directory, "skin.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const packageName = "@radix-ui/react-visually-hidden";
  const version = "1.2.3";
  manifest.dependencies[packageName] = version;
  manifest.assets.push({
    id: "radix-visually-hidden",
    kind: "dependency",
    author: "Radix UI",
    source: "https://github.com/radix-ui/primitives",
    license: "MIT",
    purpose: "functional",
    package: { name: packageName, version },
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const fieldsPath = join(directory, "views", "shared", "fields.tsx");
  const fields = await readFile(fieldsPath, "utf8");
  await writeFile(
    fieldsPath,
    `${fields}\nexport { Root as AccessibleLabel } from "${packageName}";\n`,
    "utf8"
  );
  await refreshSkinFileHashes(directory);
}

async function prepareAcceptanceWorkspace(workspaceRoot) {
  const files = {
    "package.json": `${JSON.stringify(
      {
        name: "m3-skin-source-workspace",
        private: true,
        version: "1.0.0",
      },
      null,
      2
    )}\n`,
    "pnpm-workspace.yaml": "packages:\n  - '*'\n",
    "pnpm-lock.yaml": [
      "lockfileVersion: '9.0'",
      "settings:",
      "  autoInstallPeers: true",
      "  excludeLinksFromLockfile: false",
      "importers:",
      "  .: {}",
      "",
    ].join("\n"),
  };
  const original = new Map();
  for (const [name, contents] of Object.entries(files)) {
    const path = join(workspaceRoot, name);
    await writeFile(path, contents, "utf8");
    original.set(name, await readFile(path));
  }
  return {
    checksums: Object.fromEntries(
      [...original].map(([name, contents]) => [
        name,
        createHash("sha256").update(contents).digest("hex"),
      ])
    ),
    async assertUnchanged() {
      for (const [name, expected] of original) {
        const actual = await readFile(join(workspaceRoot, name));
        if (!actual.equals(expected)) {
          throw new Error(`Parent workspace ${name} changed during generation`);
        }
      }
    },
  };
}

async function executeCase(caseName) {
  const isDependencyCase = caseName === "dependency-no-install";
  const isNoDashboardCase = caseName === "no-dashboard-local";
  const isAuthOnlyCase = caseName === "auth-only-local";
  const specialCase = isDependencyCase || isNoDashboardCase || isAuthOnlyCase;
  const sourceKind = specialCase
    ? "local"
    : caseName.slice(caseName.lastIndexOf("-") + 1);
  const preset = specialCase
    ? "custom"
    : caseName.slice(0, -(sourceKind.length + 1));
  const targetDirectory = join(runDirectory, caseName);
  let skin;
  let sourceOptions;
  if (isDependencyCase) {
    const directory = join(runDirectory, "ui-dependency-skin");
    await prepareDependencySkin(directory);
    skin = { kind: "local", directory };
  } else if (sourceKind === "builtin") {
    skin = { kind: "builtin", id: "default" };
  } else if (sourceKind === "local") {
    skin = { kind: "local", directory: fixtureDirectory };
  } else {
    if (!remoteSource) {
      const { archive, sha256 } = await buildSkinArchive(fixtureDirectory);
      httpsServer = await startLocalHttpsFixture(archive);
      remoteSource = {
        url: httpsServer.url,
        sha256,
        ca: httpsServer.ca,
      };
    }
    skin = {
      kind: "remote",
      url: remoteSource.url,
      sha256: remoteSource.sha256,
    };
    sourceOptions = {
      ca: remoteSource.ca,
      tempDirectory: join(runDirectory, "remote-source"),
    };
    await mkdir(sourceOptions.tempDirectory, { recursive: true });
  }

  const project = {
    directory: targetDirectory,
    preset,
    source: isDependencyCase ? "local-ui-dependency" : sourceKind,
    status: "running",
    steps: [],
    timingsMs: {},
    generatorSubprocesses: [],
    parentWorkspace: workspaceSnapshot.checksums,
  };
  receipt.projects[caseName] = project;
  await saveReceipt(runId, receipt);
  const generatorHooks = {
    ...(sourceOptions ? { sourceOptions } : {}),
    runProcess: async (command, args, { cwd, env }) => {
      if (
        Object.keys(env).some(
          (name) => name.toUpperCase() === "NEXTDEVTPL_SKIN_TOKEN"
        )
      ) {
        throw new Error("Skin token reached a generator child process");
      }
      const subprocess = {
        command: basename(command),
        args: [...args],
        purpose: args.includes("--lockfile-only")
          ? "lockfile-only"
          : "other",
        status: "running",
      };
      project.generatorSubprocesses.push(subprocess);
      project.currentStep = `generator-${subprocess.purpose}`;
      await saveReceipt(runId, receipt);
      const startedAt = performance.now();
      try {
        await runProcess(command, args, cwd, env);
        subprocess.status = "passed";
      } catch (error) {
        subprocess.status = "failed";
        throw error;
      } finally {
        subprocess.durationMs = Math.round(performance.now() - startedAt);
        delete project.currentStep;
        await saveReceipt(runId, receipt);
      }
    },
  };
  const generationStartedAt = performance.now();
  const modules = isNoDashboardCase
    ? ["auth", "settings", "support"]
    : isAuthOnlyCase
      ? ["auth"]
      : isDependencyCase
        ? ["auth", "dashboard"]
        : undefined;
  const { manifest } = await generateProject(
    {
      targetDirectory,
      preset,
      ...(modules ? { modules } : {}),
      ...(isNoDashboardCase
        ? {
            adapterOverrides: {
              payment: "payment:creem",
              storage: "storage:s3-compatible",
            },
          }
        : {}),
      skin,
      install: false,
    },
    generatorHooks
  );
  project.timingsMs.generate = Math.round(performance.now() - generationStartedAt);
  project.modules = manifest.modules;
  project.target = manifest.target;
  project.skin = {
    id: manifest.skin.id,
    version: manifest.skin.version,
    packageHash: manifest.skin.packageHash,
    source: manifest.skin.source,
  };
  project.status = "generated";
  await saveReceipt(runId, receipt);
  const generatedNextConfig = await readFile(
    join(targetDirectory, "next.config.mjs"),
    "utf8"
  );
  if (!generatedNextConfig.includes("outputFileTracingRoot: projectRoot")) {
    throw new Error("Generated Next.js config is missing its project tracing root");
  }

  if (isDependencyCase) {
    if (!project.generatorSubprocesses.some(({ purpose }) => purpose === "lockfile-only")) {
      throw new Error("New UI dependency did not trigger lockfile-only resolution");
    }
    if (
      !manifest.modules.includes("shared") ||
      !manifest.modules.includes("auth") ||
      !manifest.modules.includes("dashboard")
    ) {
      throw new Error("New UI dependency acceptance must retain its source view");
    }
    const generatedPackage = JSON.parse(
      await readFile(join(targetDirectory, "package.json"), "utf8")
    );
    const packageName = "@radix-ui/react-visually-hidden";
    if (generatedPackage.dependencies?.[packageName] !== "1.2.3") {
      throw new Error("Generated package omitted the exact UI dependency");
    }
    const generatedLockfile = yaml.parse(
      await readFile(join(targetDirectory, "pnpm-lock.yaml"), "utf8")
    );
    const importerEntry = generatedLockfile.importers?.["."]?.dependencies?.[
      packageName
    ];
    if (
      importerEntry?.specifier !== "1.2.3" ||
      typeof importerEntry.version !== "string" ||
      !importerEntry.version.startsWith("1.2.3")
    ) {
      throw new Error("Generated lockfile omitted the exact root UI dependency");
    }
    try {
      await access(join(targetDirectory, "node_modules"));
      throw new Error("No-install generation unexpectedly created node_modules");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await workspaceSnapshot.assertUnchanged();
  await runStep(project, "frozen-install", "pnpm", [
    "install",
    "--frozen-lockfile",
    "--prefer-offline",
    "--ignore-workspace",
  ]);
  await workspaceSnapshot.assertUnchanged();
  await runStep(project, "migration", "pnpm", ["db:generate:init"]);
  await runStep(project, "lint", "pnpm", ["lint"]);
  await runStep(project, "typecheck", "pnpm", ["typecheck"]);
  await runStep(project, "smoke", "pnpm", ["test:run"]);
  if (manifest.target === "cloudflare") {
    await runStep(project, "cloudflare-types", "pnpm", ["cf:types"]);
  }
  await runStep(project, "build", "pnpm", ["build"]);
  if (manifest.target !== "cloudflare") {
    await runStep(project, "health", "pnpm", ["verify:health"]);
  }
  project.timingsMs.total =
    project.timingsMs.generate +
    project.steps.reduce((total, step) => total + (step.durationMs ?? 0), 0);
  project.status = "passed";
  await saveReceipt(runId, receipt);
}

try {
  await access(fixtureDirectory);
  await access(assets.templateRoot);
  await mkdir(artifactDirectory, { recursive: true });
  workspaceSnapshot = await prepareAcceptanceWorkspace(runDirectory);
  await writeFile(
    join(runDirectory, privateMarkerName),
    `${JSON.stringify({ runId })}\n`,
    "utf8"
  );
  await saveReceipt(runId, receipt);
  for (const caseName of selectedCases) {
    process.stdout.write(`\nM3 skin source acceptance: ${caseName}\n`);
    try {
      await executeCase(caseName);
    } catch (error) {
      const project = receipt.projects[caseName];
      if (project) {
        project.status = "failed";
        project.error = await fail(error);
      }
      await saveReceipt(runId, receipt);
      throw error;
    }
  }
  await workspaceSnapshot.assertUnchanged();
  receipt.completed = true;
  receipt.status = "passed";
} catch (error) {
  finalError = error;
  receipt.status = "failed";
  receipt.error = await fail(error);
} finally {
  await httpsServer?.close();
  receipt.durationMs = Math.round(performance.now() - runStartedAt);
  if (!cli.keep) {
    await rm(runDirectory, { recursive: true, force: true });
    receipt.removed = true;
    receipt.retained = false;
  }
  await saveReceipt(runId, receipt);
}

process.stdout.write(
  `M3 skin source receipt: ${join(artifactDirectory, `${runId}.json`)}\n`
);
if (cli.keep) process.stdout.write(`M3 skin source artifacts: ${runDirectory}\n`);
if (finalError) process.exitCode = 1;
