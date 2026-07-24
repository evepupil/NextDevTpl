import { access, readFile, stat } from "node:fs/promises";
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

export async function assertGeneratedProject(target, matrixCase, manifest) {
  if (
    manifest.preset !== matrixCase.preset ||
    manifest.target !== matrixCase.target
  ) {
    throw new Error(
      `Generated manifest does not match ${matrixCase.id}: ${manifest.preset}/${manifest.target}`
    );
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

  const packageJson = JSON.parse(
    await readFile(join(target, "package.json"), "utf8")
  );
  if (!packageJson.scripts?.[matrixCase.buildScript]) {
    throw new Error(
      `${matrixCase.id} is missing build script: ${matrixCase.buildScript}`
    );
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
      `Cloudflare worker exceeds the free compressed limit: ${compressedBytes} > ${freeLimitBytes}`
    );
  }
  return { compressedBytes, sourceBytes };
}
