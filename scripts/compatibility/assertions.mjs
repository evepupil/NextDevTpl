import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
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

export async function assertGeneratedProject(target, matrixCase, manifest) {
  const expectedMode = matrixCase.mode ?? "full";
  const expectedPreset =
    matrixCase.expectedPreset ?? matrixCase.preset ?? "custom";
  if (
    manifest.mode !== expectedMode ||
    manifest.preset !== expectedPreset ||
    manifest.target !== matrixCase.target
  ) {
    throw new Error(
      `Generated manifest does not match ${matrixCase.id}: ` +
        `${manifest.mode}/${manifest.preset}/${manifest.target}`
    );
  }

  const expectedSkinKind = matrixCase.skin?.kind ?? "builtin";
  const expectedSkinId =
    matrixCase.expectedSkinId ??
    (matrixCase.skin?.kind === "builtin" ? matrixCase.skin.id : "default");
  if (manifest.skin?.source?.kind !== expectedSkinKind) {
    throw new Error(
      `${matrixCase.id} skin source does not match ${expectedSkinKind}`
    );
  }
  if (manifest.skin?.id !== expectedSkinId) {
    throw new Error(`${matrixCase.id} skin id does not match ${expectedSkinId}`);
  }
  if (manifest.skin?.palette?.id !== matrixCase.palette) {
    throw new Error(`${matrixCase.id} palette record does not match`);
  }

  for (const [service, adapter] of Object.entries(
    matrixCase.adapters ?? {}
  )) {
    if (manifest.adapters?.[service] !== adapter) {
      throw new Error(
        `${matrixCase.id} selected ${service} adapter does not match ${adapter}`
      );
    }
  }

  for (const path of matrixCase.requiredPaths) {
    if (!(await exists(join(target, path)))) {
      throw new Error(`${matrixCase.id} is missing required path: ${path}`);
    }
  }
  for (const path of matrixCase.forbiddenPaths) {
    if (await exists(join(target, path))) {
      throw new Error(`${matrixCase.id} retained forbidden path: ${path}`);
    }
  }

  if (matrixCase.requiredEnv || matrixCase.forbiddenEnv) {
    const environment = await readFile(join(target, ".env.example"), "utf8");
    const names = new Set(
      [...environment.matchAll(/^([A-Z][A-Z0-9_]*)=/gmu)].map(
        (match) => match[1]
      )
    );
    for (const name of matrixCase.requiredEnv ?? []) {
      if (!names.has(name)) {
        throw new Error(`${matrixCase.id} is missing environment variable: ${name}`);
      }
    }
    for (const name of matrixCase.forbiddenEnv ?? []) {
      if (names.has(name)) {
        throw new Error(
          `${matrixCase.id} retained forbidden environment variable: ${name}`
        );
      }
    }
  }

  const packageJson = JSON.parse(
    await readFile(join(target, "package.json"), "utf8")
  );
  if (!packageJson.scripts?.[matrixCase.buildScript]) {
    throw new Error(
      `${matrixCase.id} is missing build script: ${matrixCase.buildScript}`
    );
  }

  const hasPaletteLicense = await exists(join(target, "STYLEKIT-LICENSE.txt"));
  if (hasPaletteLicense !== Boolean(matrixCase.palette)) {
    throw new Error(`${matrixCase.id} palette license presence does not match`);
  }
  if (matrixCase.palette) {
    const notice = await readFile(join(target, "STYLEKIT-LICENSE.txt"), "utf8");
    if (!notice.includes("MIT License")) {
      throw new Error(`${matrixCase.id} palette license is incomplete`);
    }
    if (await exists(join(target, "palettes"))) {
      throw new Error(`${matrixCase.id} contains the complete palette snapshot`);
    }
  }

  if (expectedMode === "demo") {
    if (
      manifest.modules.length !== 0 ||
      Object.keys(manifest.adapters).length !== 0 ||
      manifest.bindings.length !== 0 ||
      manifest.viewModules?.length !== 8 ||
      !/^[a-f0-9]{64}$/u.test(manifest.demo?.dataSha256 ?? "")
    ) {
      throw new Error(`${matrixCase.id} demo record contains an invalid selection`);
    }

    const environment = await readFile(join(target, ".env.example"), "utf8");
    if (/^\s*[A-Z_][A-Z0-9_]*\s*=/mu.test(environment)) {
      throw new Error(`${matrixCase.id} demo requires environment variables`);
    }
    const rootFiles = await readdir(target);
    if (
      rootFiles.some(
        (name) => /^\.env(?:$|\.)/u.test(name) && name !== ".env.example"
      )
    ) {
      throw new Error(`${matrixCase.id} contains a real environment file`);
    }

    const scripts = Object.entries(packageJson.scripts ?? {});
    if (
      scripts.some(
        ([name, command]) =>
          /db:|cf:|migrat|telemetry/iu.test(name) ||
          /drizzle|wrangler|check-health|verify-production-health/iu.test(command)
      )
    ) {
      throw new Error(`${matrixCase.id} retains a backend-only script`);
    }
    const dependencies = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    });
    const dependency = dependencies.find((name) =>
      forbiddenDemoDependencyPatterns.some((pattern) => pattern.test(name))
    );
    if (dependency) {
      throw new Error(`${matrixCase.id} retains backend dependency ${dependency}`);
    }
  }

  if (matrixCase.target === "docker") {
    const dockerfile = await readFile(join(target, "Dockerfile"), "utf8");
    if (!dockerfile.includes("pnpm install --frozen-lockfile --ignore-scripts")) {
      throw new Error(
        `${matrixCase.id} must defer lifecycle scripts until source is copied`
      );
    }
    if (!dockerfile.includes("pnpm run --if-present postinstall")) {
      throw new Error(`${matrixCase.id} must run optional postinstall in builder`);
    }
    const compose = await readFile(join(target, "compose.yaml"), "utf8");
    if (!compose.includes("  PORT: 3000")) {
      throw new Error(
        `${matrixCase.id} must keep the container port fixed at 3000`
      );
    }
  }

  if (matrixCase.target === "cloudflare") {
    const logger = await readFile(
      join(target, "src", "lib", "logger", "index.ts"),
      "utf8"
    );
    if (packageJson.dependencies?.pino || packageJson.devDependencies?.pino) {
      throw new Error(`${matrixCase.id} must not retain Pino`);
    }
    if (
      packageJson.dependencies?.["pino-pretty"] ||
      packageJson.devDependencies?.["pino-pretty"]
    ) {
      throw new Error(`${matrixCase.id} must not retain pino-pretty`);
    }
    if (logger.includes('from "pino"') || !logger.includes("console[")) {
      throw new Error(
        `${matrixCase.id} must use the Workers-compatible console logger`
      );
    }
  }
}

export async function assertBuildArtifact(target, matrixCase) {
  if (matrixCase.target !== "cloudflare") {
    await access(join(target, ".next", "standalone", "server.js"));
    return undefined;
  }

  const workerPath = join(target, ".open-next", "worker.js");
  const worker = await readFile(workerPath);
  const compressedBytes = gzipSync(worker, { level: 9 }).byteLength;
  const sourceBytes = (await stat(workerPath)).size;
  const freeLimitBytes = 3 * 1024 * 1024;
  if (compressedBytes > freeLimitBytes) {
    throw new Error(
      "Cloudflare worker exceeds the free compressed limit: " +
        `${compressedBytes} > ${freeLimitBytes}`
    );
  }
  return { compressedBytes, sourceBytes };
}
