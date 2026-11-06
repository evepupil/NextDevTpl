import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const command = process.argv[2] ?? "check";
const directory = resolve(process.argv[3] ?? resolve(repositoryRoot, "src", "skin"));

if (command !== "check" && command !== "hash") {
  throw new Error("Usage: node scripts/verify-skin.mjs [check|hash] [skin-directory]");
}

const [{ loadCatalog }, skinApi] = await Promise.all([
  import("../packages/create-nextdevtpl/dist/catalog.js"),
  import("../packages/create-nextdevtpl/dist/skins/index.js"),
]);
const catalog = await loadCatalog(resolve(repositoryRoot, "recipes", "catalog.json"), {
  templateRoot: repositoryRoot,
});

if (command === "hash") {
  const manifest = await skinApi.refreshSkinFileHashes(directory);
  console.log(`Updated ${Object.keys(manifest.files).length} skin file hashes.`);
} else {
  const manifest = await skinApi.readSkinManifest(directory);
  const skin = await skinApi.validateSkinPackage({
    directory,
    templateDirectory: repositoryRoot,
    catalog,
    selectedModules: manifest.modules,
  });
  console.log(`Skin ${skin.manifest.id}@${skin.manifest.version} is valid (${skin.packageHash}).`);
}
