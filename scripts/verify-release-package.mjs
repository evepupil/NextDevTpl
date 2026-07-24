import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateReleasePackage } from "./release/package-manifest.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(repositoryRoot, "packages", "create-nextdevtpl");
const packageJson = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8")
);
const roadmap = await readFile(
  resolve(repositoryRoot, "docs", "roadmap2.x.md"),
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
});

process.stdout.write(
  `Release package verified: ${result.name}@${result.version}, ${result.fileCount} files\n`
);
