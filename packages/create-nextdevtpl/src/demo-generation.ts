import { createHash } from "node:crypto";
import { lstat, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseDocument } from "yaml";

import {
  DEFAULT_DEMO_DATA,
  mergeDemoData,
  parseDemoDataPatch,
  serializeDemoData,
} from "./demo-contract-generated/core/skin/demo/index.js";
import type { DemoData } from "./demo-contract-generated/core/skin/demo/types.js";
import { writeText } from "./filesystem.js";
import { GeneratorError } from "./generator-error.js";
import { sha256 } from "./skins/hash.js";
import { readPackageFile } from "./skins/package-files.js";
import type { ValidatedSkin } from "./skins/types.js";
import { recordTargetFile } from "./target-transaction.js";
import type { GeneratorOptions, RecipeCatalog } from "./types.js";

export const DEMO_VIEW_MODULES = [
  "auth",
  "blog",
  "dashboard",
  "marketing",
  "pseo",
  "settings",
  "shared",
  "support",
] as const;

export interface PreparedDemoData {
  avatarAssetContents: readonly { path: string; content: Buffer }[];
  data: DemoData;
  dataSha256: string;
  serialized: string;
  avatarAssets: readonly string[];
}

export function validateDemoOptions(options: GeneratorOptions): void {
  if (options.mode !== "demo") return;
  if (
    Object.hasOwn(options, "preset") ||
    Object.hasOwn(options, "modules") ||
    Object.hasOwn(options, "adapterOverrides")
  ) {
    throw new GeneratorError(
      "Demo mode does not accept preset, modules, or adapter overrides"
    );
  }
  if ((options.target ?? "server") !== "server") {
    throw new GeneratorError("Demo mode supports only the server target");
  }
}

export function validateDemoViewModules(catalog: RecipeCatalog): void {
  for (const moduleId of DEMO_VIEW_MODULES) {
    const module = catalog.modules[moduleId];
    if (!module?.views?.length || !module.viewContract || !module.skinEntry) {
      throw new GeneratorError(
        `Demo view module is missing catalog metadata: ${moduleId}`
      );
    }
  }
}

function getAvatarPaths(data: DemoData): string[] {
  return [
    data.workspace.user.image,
    ...data.support.tickets.flatMap((ticket) =>
      ticket.messages.map((message) =>
        message.author.kind === "staff" ? message.author.image : null
      )
    ),
  ].filter((path): path is string => path !== null);
}

export async function prepareDemoData(
  skin: ValidatedSkin
): Promise<PreparedDemoData> {
  let patchInput: unknown = { schemaVersion: 1 };
  const dataPath = skin.manifest.demo?.data;
  if (dataPath) {
    const content = await readPackageFile(skin.directory, dataPath);
    if (content.byteLength > 262_144) {
      throw new GeneratorError("Skin demo data exceeds the 256 KiB limit");
    }
    if (sha256(content) !== skin.manifest.files[dataPath]) {
      throw new GeneratorError(
        "Skin demo data no longer matches its declared hash"
      );
    }
    const source = content.toString("utf8");
    const document = parseDocument(source, {
      schema: "json",
      uniqueKeys: true,
    });
    if (document.errors.length > 0) {
      throw new GeneratorError("Skin demo data contains invalid JSON");
    }
    try {
      patchInput = JSON.parse(source) as unknown;
    } catch {
      throw new GeneratorError("Skin demo data contains invalid JSON");
    }
  }

  const data = mergeDemoData(DEFAULT_DEMO_DATA, parseDemoDataPatch(patchInput));
  const fileAssets = new Set(
    skin.manifest.assets
      .filter((asset) => asset.kind === "file")
      .flatMap((asset) => asset.files ?? [])
  );
  const avatarAssets = [...new Set(getAvatarPaths(data))];
  if (avatarAssets.some((path) => !fileAssets.has(path))) {
    throw new GeneratorError(
      "Demo avatar must reference a declared, hashed skin file asset"
    );
  }
  const avatarAssetContents = await Promise.all(
    avatarAssets.map(async (path) => {
      const filePath = resolve(skin.directory, ...path.split("/"));
      const info = await lstat(filePath);
      const content = await readPackageFile(skin.directory, path);
      if (
        !info.isFile() ||
        info.isSymbolicLink() ||
        sha256(content) !== skin.manifest.files[path]
      ) {
        throw new GeneratorError(
          "Demo avatar must be a regular file matching its declared hash"
        );
      }
      return { path, content };
    })
  );
  const serialized = serializeDemoData(data);
  const dataSha256 = createHash("sha256")
    .update(serialized, "utf8")
    .digest("hex");
  return { avatarAssetContents, data, dataSha256, serialized, avatarAssets };
}

export async function writeDemoAvatarAssets(
  target: string,
  assets: PreparedDemoData["avatarAssetContents"]
): Promise<void> {
  for (const asset of assets) {
    const destination = resolve(
      target,
      "public",
      "skin-assets",
      ...asset.path.split("/")
    );
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, asset.content);
    await recordTargetFile(destination, asset.content);
  }
}

export async function writePreparedDemoData(
  target: string,
  prepared: PreparedDemoData
): Promise<void> {
  await writeText(
    resolve(target, "src", "core", "skin", "demo", "data.ts"),
    `import type { DemoData } from "./types.js";\n\nexport const initialDemoData = ${prepared.serialized.trim()} satisfies DemoData;\n`
  );
}
