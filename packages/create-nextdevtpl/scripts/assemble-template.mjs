import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "..", "..");
const manifestPath = resolve(repositoryRoot, "templates", "base", "manifest.json");
const catalogPath = resolve(repositoryRoot, "recipes", "catalog.json");
const templateRoot = resolve(packageRoot, "template");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

await rm(templateRoot, { recursive: true, force: true });
await mkdir(templateRoot, { recursive: true });
for (const entry of manifest.entries) {
  const targetEntry = entry === ".gitignore" ? "gitignore" : entry;
  await cp(resolve(repositoryRoot, entry), resolve(templateRoot, targetEntry), {
    recursive: true,
  });
}
await rm(resolve(templateRoot, "src", "test"), { recursive: true, force: true });
await cp(manifestPath, resolve(templateRoot, "manifest.json"));
await cp(catalogPath, resolve(packageRoot, "catalog.json"));
