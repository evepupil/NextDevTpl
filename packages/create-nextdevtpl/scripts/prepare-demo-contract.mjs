import { lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "..", "..");
const sourceRoot = resolve(repositoryRoot, "src");
const outputRoot = resolve(
  packageRoot,
  "src",
  "demo-contract-generated"
);
const sourceFiles = [
  "core/plans/contracts.ts",
  "core/credits/contracts.ts",
  "core/support/contracts.ts",
  "core/skin/demo/types.ts",
  "core/skin/demo/validation/common.ts",
  "core/skin/demo/validation/records.ts",
  "core/skin/demo/schema.ts",
  "core/skin/demo/defaults.ts",
  "core/skin/demo/merge.ts",
  "core/skin/demo/serialization.ts",
  "core/skin/demo/index.ts",
];

const args = process.argv.slice(2);
const checkOnly = args.length === 1 && args[0] === "--check";
if (args.length > 0 && !checkOnly) {
  throw new Error("Usage: node scripts/prepare-demo-contract.mjs [--check]");
}

async function readRegularFile(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Demo contract mirror source is not a regular file: ${path}`);
  }
  return readFile(path);
}

async function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Demo contract mirror contains a symbolic link: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Demo contract mirror contains an unsupported file: ${relativePath}`);
    }
  }
  return files.sort();
}

async function checkMirror() {
  const expected = [...sourceFiles].sort();
  const actual = await listFiles(outputRoot);
  if (
    expected.length !== actual.length ||
    expected.some((file, index) => file !== actual[index])
  ) {
    throw new Error("Generated demo contract mirror file set is stale");
  }
  for (const file of sourceFiles) {
    const [source, mirror] = await Promise.all([
      readRegularFile(resolve(sourceRoot, file)),
      readRegularFile(resolve(outputRoot, file)),
    ]);
    if (!source.equals(mirror)) {
      throw new Error(`Generated demo contract mirror is stale: ${file}`);
    }
  }
}

async function refreshMirror() {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  for (const file of sourceFiles) {
    const source = resolve(sourceRoot, file);
    const destination = resolve(outputRoot, file);
    const content = await readRegularFile(source);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
}

if (checkOnly) await checkMirror();
else await refreshMirror();
