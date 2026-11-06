import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  refreshSkinFileHashes,
  validateSkinPackage,
} from "../../../packages/create-nextdevtpl/src/skins";
import type {
  SkinManifest,
  ValidatedSkin,
} from "../../../packages/create-nextdevtpl/src/skins/types";
import type { RecipeCatalog } from "../../../packages/create-nextdevtpl/src/types";

type FileContents = string | Uint8Array;

const DEFAULT_SKIN_FILES: Readonly<Record<string, FileContents>> = {
  "config.ts": [
    "export const skinConfig = {",
    '  defaultTheme: "system",',
    '  fonts: { body: "system", heading: "system", mono: "monospace" },',
    "} as const;",
    "",
  ].join("\n"),
  "fonts.ts": 'export const fontClassName = "";\n',
  "tokens.css": ":root { --skin-test-color: #123456; }\n",
  "views/shared/index.tsx": [
    "const DashboardLayout = () => null;",
    "const EmptyDashboard = () => null;",
    "export const views = {",
    '  "shared.dashboard-layout": DashboardLayout,',
    '  "shared.empty-dashboard": EmptyDashboard,',
    "} satisfies Record<string, () => null>;",
    "",
  ].join("\n"),
};

const DEFAULT_TEMPLATE_FILES: Readonly<Record<string, FileContents>> = {
  "package.json": JSON.stringify({
    dependencies: {
      "lucide-react": "0.562.0",
      next: "16.2.11",
      react: "19.2.3",
    },
  }),
  "src/components/ui/button.tsx": "export function Button() { return null; }\n",
  "src/core/skin/index.ts":
    "export type SkinViewProps = Record<string, unknown>;\n",
  "src/core/skin/version.json": JSON.stringify({
    templateVersion: "4.0.0",
    viewApiVersion: 1,
  }),
  "src/features/auth/view/index.ts": "export interface AuthViewProps {}\n",
  "src/features/dashboard/view/index.ts":
    "export interface DashboardViewProps {}\n",
  "src/features/shared/actions/index.ts": "export async function action() {}\n",
  "src/features/shared/server/index.ts":
    "export async function readData() {}\n",
  "src/features/shared/view/index.ts": "export interface SharedViewProps {}\n",
  "src/db/index.ts": "export const database = {};\n",
  "src/adapters/index.ts": "export const adapter = {};\n",
  "src/services/index.ts": "export const service = {};\n",
};

function moduleDefinition(
  views: CatalogModuleView[] = [],
  dependencies: readonly string[] = []
) {
  const owner = views[0]?.id.split(".")[0];
  return {
    dependencies,
    env: [],
    kind: "core" as const,
    routes: [],
    schema: [],
    telemetryEvents: [],
    translations: [],
    ...(owner
      ? {
          views,
          viewContract: `src/features/${owner}/view/index.ts`,
          skinEntry: `src/skin/views/${owner}/index.ts`,
          skinSources: [`src/skin/views/${owner}`],
        }
      : {}),
  };
}

interface CatalogModuleView {
  id: string;
  kind: "layout" | "page";
}

export function createSkinCatalog(
  modules: RecipeCatalog["modules"] = {
    auth: moduleDefinition([{ id: "auth.layout", kind: "layout" }], ["shared"]),
    credits: moduleDefinition(),
    dashboard: moduleDefinition(
      [{ id: "dashboard.overview", kind: "page" }],
      ["shared"]
    ),
    shared: moduleDefinition([
      { id: "shared.dashboard-layout", kind: "layout" },
      { id: "shared.empty-dashboard", kind: "page" },
    ]),
  }
): RecipeCatalog {
  return {
    adapters: {},
    modules,
    presets: {},
    version: 1,
  };
}

export function createSkinManifest(
  overrides: Partial<SkinManifest> = {}
): SkinManifest {
  return {
    schemaVersion: 1,
    id: "test-skin",
    name: "Test Skin",
    version: "1.2.3",
    compatibility: { template: "^4.0.0", viewApi: 1 },
    modules: ["shared"],
    viewEntries: { shared: "views/shared/index.tsx" },
    uiOverrides: {},
    customization: {
      brandColor: null,
      radius: null,
      fonts: null,
      defaultTheme: ["system"],
    },
    supportsPalettes: false,
    dependencies: {},
    assets: [],
    files: {},
    ...overrides,
  };
}

async function writeFiles(
  directory: string,
  files: Readonly<Record<string, FileContents>>
): Promise<void> {
  for (const [relativePath, contents] of Object.entries(files)) {
    const path = join(directory, ...relativePath.split("/"));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }
}

export interface SkinFixture {
  root: string;
  directory: string;
  templateDirectory: string;
  catalog: RecipeCatalog;
  selectedModules: readonly string[];
  manifest: SkinManifest;
  writeSkinFile(path: string, contents: FileContents): Promise<void>;
  writeManifest(value: unknown): Promise<void>;
  refreshHashes(): Promise<SkinManifest>;
  validate(): Promise<ValidatedSkin>;
  dispose(): Promise<void>;
}

export async function createSkinFixture(
  options: {
    skinFiles?: Readonly<Record<string, FileContents>>;
    templateFiles?: Readonly<Record<string, FileContents>>;
    manifest?: Partial<SkinManifest>;
    catalog?: RecipeCatalog;
    selectedModules?: readonly string[];
  } = {}
): Promise<SkinFixture> {
  const root = await mkdtemp(join(tmpdir(), "nextdevtpl-skin-"));
  const directory = join(root, "skin");
  const templateDirectory = join(root, "template");
  await mkdir(directory, { recursive: true });
  await mkdir(templateDirectory, { recursive: true });

  const catalog = options.catalog ?? createSkinCatalog();
  const selectedModules = options.selectedModules ?? ["shared"];
  const skinFiles = { ...DEFAULT_SKIN_FILES, ...options.skinFiles };
  const templateFiles = {
    ...DEFAULT_TEMPLATE_FILES,
    ...options.templateFiles,
  };

  try {
    await writeFiles(directory, skinFiles);
    await writeFiles(templateDirectory, templateFiles);
    const initialManifest = createSkinManifest({
      ...options.manifest,
      files: {},
    });
    await writeFile(
      join(directory, "skin.json"),
      JSON.stringify(initialManifest, null, 2),
      "utf8"
    );
    const manifest = await refreshSkinFileHashes(directory);
    await writeFile(
      join(directory, "skin.json"),
      JSON.stringify(manifest, null, 2),
      "utf8"
    );

    return {
      root,
      directory,
      templateDirectory,
      catalog,
      selectedModules,
      manifest,
      writeSkinFile: async (path, contents) => {
        const absolutePath = join(directory, ...path.split("/"));
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, contents);
      },
      writeManifest: async (value) => {
        const serialized = JSON.stringify(value, null, 2);
        if (serialized === undefined) {
          throw new Error("Unable to serialize skin manifest fixture");
        }
        await writeFile(join(directory, "skin.json"), serialized, "utf8");
      },
      refreshHashes: async () => {
        const refreshed = await refreshSkinFileHashes(directory);
        await writeFile(
          join(directory, "skin.json"),
          JSON.stringify(refreshed, null, 2),
          "utf8"
        );
        return refreshed;
      },
      validate: () =>
        validateSkinPackage({
          directory,
          templateDirectory,
          catalog,
          selectedModules,
        }),
      dispose: () => rm(root, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}
