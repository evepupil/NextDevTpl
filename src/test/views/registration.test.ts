import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type ModuleManifest, validateModuleManifests } from "@/core/modules";
import { createModuleSelection, moduleRegistry } from "@/modules";
import {
  loadCatalog,
  validateCatalog,
} from "../../../packages/create-nextdevtpl/src/catalog";
import {
  writeJson,
  writeText,
} from "../../../packages/create-nextdevtpl/src/filesystem";
import type { RecipeCatalog } from "../../../packages/create-nextdevtpl/src/types";
import {
  pruneUnselectedSkinSources,
  writeSelectedSkinViews,
} from "../../../packages/create-nextdevtpl/src/view-composition";

const baseModule: ModuleManifest = {
  id: "shared",
  name: "Shared",
  description: "Shared functionality",
  kind: "core",
  dependencies: [],
  routes: [],
  navigation: [],
  translations: [],
  schema: [],
  telemetryEvents: [],
};

describe("module view registration", () => {
  it("keeps view metadata optional for modules without pages", () => {
    expect(validateModuleManifests([baseModule])).toEqual([]);
  });

  it.each([
    { id: "not-a-view", kind: "page" },
    { id: "auth.sign-in", kind: "page" },
    { id: "shared.page", kind: "screen" },
  ])("rejects an invalid view definition: $id / $kind", (view) => {
    const manifest = {
      ...baseModule,
      views: [view],
    } as unknown as ModuleManifest;
    expect(validateModuleManifests([manifest]).length).toBeGreaterThan(0);
  });

  it("rejects duplicate view identifiers within and across owners", () => {
    const view = { id: "shared.page", kind: "page" } as const;
    expect(
      validateModuleManifests([{ ...baseModule, views: [view, view] }])
    ).toContain("视图 shared.page 同时属于 shared 和 shared");
    expect(
      validateModuleManifests([
        { ...baseModule, views: [view] },
        { ...baseModule, id: "auth", views: [view] },
      ])
    ).toContain("视图 shared.page 同时属于 shared 和 auth");
  });

  it("selects only views owned by the selected dependency closure", () => {
    const selection = createModuleSelection(["shared"]);
    expect(selection.modules).toEqual(["shared"]);
    expect(selection.views).toEqual([
      { id: "shared.dashboard-layout", kind: "layout" },
      { id: "shared.empty-dashboard", kind: "page" },
    ]);
    expect(selection.excludedModules).toContain("auth");
  });
});

describe("generator view metadata and files", () => {
  let root: string;
  let catalog: RecipeCatalog;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "nextdevtpl-views-"));
    // 在独立清单位置验证结构；完整模板的文件闭包由 generator-catalog 覆盖。
    const input = JSON.parse(
      await readFile(resolve("recipes/catalog.json"), "utf8")
    ) as RecipeCatalog;
    const path = join(root, "catalog.json");
    await writeJson(path, input);
    catalog = await loadCatalog(path);
  });

  afterAll(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it("keeps generator and feature view ownership identical", () => {
    for (const manifest of moduleRegistry.manifests) {
      expect(catalog.modules[manifest.id]?.views ?? []).toEqual(
        manifest.views ?? []
      );
    }
  });

  it("rejects incomplete entry metadata and unauthorized skin source paths", async () => {
    const recipe = catalog.modules.auth;
    if (!recipe) throw new Error("Missing auth recipe");
    const missingEntry = { ...recipe };
    delete missingEntry.skinEntry;
    const invalidRecipes = [
      missingEntry,
      { ...recipe, skinSources: ["src/skin/views/shared"] },
      {
        ...recipe,
        skinSources: ["src/skin/views/auth", "src/skin/../outside"],
      },
    ];
    for (const invalid of invalidRecipes) {
      const errors = await validateCatalog({
        ...catalog,
        modules: { ...catalog.modules, auth: invalid },
      });
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid view kinds while parsing recipe data", async () => {
    const recipe = catalog.modules.auth;
    const path = join(root, "invalid-kind.json");
    await writeJson(path, {
      ...catalog,
      modules: {
        ...catalog.modules,
        auth: { ...recipe, views: [{ id: "auth.page", kind: "screen" }] },
      },
    });
    await expect(loadCatalog(path)).rejects.toThrow(
      "Invalid module recipe: auth"
    );
  });

  it("writes the selected registry and physically removes only unselected skin sources", async () => {
    const target = join(root, "selection");
    const selectedView = join(target, "src/skin/views/shared/index.ts");
    const selectedLayout = join(target, "src/skin/layouts/dashboard.tsx");
    const excludedView = join(target, "src/skin/views/auth/index.ts");
    const excludedLayout = join(target, "src/skin/layouts/auth.tsx");
    for (const path of [
      selectedView,
      selectedLayout,
      excludedView,
      excludedLayout,
    ]) {
      await writeText(path, "export {};\n");
    }

    await writeSelectedSkinViews(target, ["shared"], catalog);
    await pruneUnselectedSkinSources(target, ["shared"], catalog);

    await expect(access(selectedView)).resolves.toBeUndefined();
    await expect(access(selectedLayout)).resolves.toBeUndefined();
    await expect(access(excludedView)).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(access(excludedLayout)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const registry = await readFile(
      join(target, "src/modules/skin-views.ts"),
      "utf8"
    );
    expect(registry).toContain('from "@/features/shared/view"');
    expect(registry).toContain('from "@/skin/views/shared"');
    expect(registry).not.toContain("@/features/auth");
    expect(registry).not.toContain("@/skin/views/auth");
  });

  it("rejects attempts to delete the skin root or files outside it", async () => {
    const target = join(root, "guarded");
    const sentinel = join(target, "outside.txt");
    const skinFile = join(target, "src/skin/keep.txt");
    await writeText(sentinel, "keep");
    await writeText(skinFile, "keep");
    for (const source of ["src/skin", "outside.txt", "../outside"]) {
      await expect(
        pruneUnselectedSkinSources(target, [], {
          ...catalog,
          modules: {
            auth: { ...catalog.modules.auth!, skinSources: [source] },
          },
        })
      ).rejects.toThrow("Skin source is outside src/skin");
      expect(await readFile(sentinel, "utf8")).toBe("keep");
      expect(await readFile(skinFile, "utf8")).toBe("keep");
    }
  });
});
