import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { validateReleasePackage } from "./release/package-manifest.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(repositoryRoot, "packages", "create-nextdevtpl");

async function collectRuntimeFiles(directory, extensions) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectRuntimeFiles(path, extensions)));
    } else if (entry.isFile() && extensions.has(extname(entry.name))) {
      files.push(relative(packageRoot, path).split(sep).join("/"));
    }
  }
  return files;
}

const packageJson = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8")
);
const roadmap = await readFile(
  resolve(repositoryRoot, "docs", "roadmap4.x.md"),
  "utf8"
);
const packArguments = ["pack", "--dry-run", "--ignore-scripts", "--json"];
const packOutput =
  process.platform === "win32"
    ? execFileSync(
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/s", "/c", "npm", ...packArguments],
        { cwd: packageRoot, encoding: "utf8" }
      )
    : execFileSync("npm", packArguments, {
        cwd: packageRoot,
        encoding: "utf8",
      });
const packResults = JSON.parse(packOutput);

if (!Array.isArray(packResults) || packResults.length !== 1) {
  throw new Error("npm pack must return exactly one package manifest");
}

const result = validateReleasePackage({
  files: packResults[0].files,
  packageJson,
  roadmap,
  requiredRuntimeFiles: [
    ...(await collectRuntimeFiles(
      resolve(packageRoot, "dist"),
      new Set([".js"])
    )),
    ...(await collectRuntimeFiles(
      resolve(packageRoot, "template", "src", "core", "skin", "demo"),
      new Set([".ts", ".tsx", ".json"])
    )),
  ],
});

process.stdout.write(
  `Release package verified: ${result.name}@${result.version}, ${result.fileCount} files\n`
);
