import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODULE_IDS,
  type ModuleId,
  resolveModuleClosure,
} from "@/core/modules";
import { adminNav, dashboardNav } from "@/config/nav";
import {
  createPresetSelection,
  modulePresets,
  moduleRegistry,
} from "@/modules";

const sourceRoot = resolve(process.cwd(), "src");
const featureRoot = join(sourceRoot, "features");
const importPattern =
  /(?:from\s+|import\s*\()\s*["']@\/features\/([^/"']+)(\/[^"']+)?["']/g;
const publicRuntimeEntries = new Set([
  "/actions",
  "/components",
  "/config",
  "/server",
  "/types",
  "/utils",
]);

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return collectSourceFiles(path);
    }
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : [];
  });
}

function getOwningFeature(path: string): ModuleId | undefined {
  const relativePath = relative(featureRoot, path);
  if (relativePath.startsWith(`..${sep}`) || relativePath === "..") {
    return undefined;
  }
  const [feature] = relativePath.split(sep);
  return MODULE_IDS.find((id) => id === feature);
}

describe("module registry", () => {
  it("registers every feature exactly once", () => {
    expect([...moduleRegistry.byId.keys()].sort()).toEqual(
      [...MODULE_IDS].sort()
    );
  });

  it("keeps the minimal authenticated workspace free of optional modules", () => {
    const closure = resolveModuleClosure(moduleRegistry, modulePresets.minimal);
    const optionalModules = closure.filter(
      (id) => moduleRegistry.byId.get(id)?.kind === "optional"
    );

    expect(closure.sort()).toEqual(["auth", "dashboard", "mail", "shared"]);
    expect(optionalModules).toEqual([]);
  });

  it("produces a removable minimal source selection", () => {
    const selection = createPresetSelection("minimal");

    expect([...selection.modules].sort()).toEqual([
      "auth",
      "dashboard",
      "mail",
      "shared",
    ]);
    expect([...selection.schema].sort()).toEqual(["auth", "mail"]);
    expect(selection.routeSources).toContain(
      "src/app/[locale]/(dashboard)/dashboard/page.tsx"
    );
    expect(selection.routeSources).not.toContain(
      "src/app/[locale]/(dashboard)/dashboard/support/page.tsx"
    );
    expect(selection.excludedModules).toContain("support");
  });

  it("builds dashboard and admin navigation from module contributions", () => {
    expect(
      dashboardNav.flatMap((group) => group.items.map((item) => item.href))
    ).toEqual([
      "/dashboard",
      "/dashboard/credits",
      "/dashboard/settings",
      "/dashboard/support",
    ]);
    expect(
      adminNav.flatMap((group) => group.items.map((item) => item.href))
    ).toEqual(["/admin", "/admin/users", "/admin/tickets"]);
  });

  it("registers every top-level translation namespace in both locales", () => {
    const registeredNamespaces = new Set(
      moduleRegistry.manifests.flatMap((manifest) => manifest.translations)
    );
    const localeKeys = ["en", "zh"].map((locale) => {
      const path = resolve(process.cwd(), "messages", `${locale}.json`);
      const messages = JSON.parse(readFileSync(path, "utf8")) as Record<
        string,
        unknown
      >;
      return Object.keys(messages).sort();
    });

    expect([...registeredNamespaces].sort()).toEqual(localeKeys[0]);
    expect(localeKeys[1]).toEqual(localeKeys[0]);
  });

  it("maps every registered route to an existing source file", () => {
    const missingRoutes = moduleRegistry.manifests
      .flatMap((manifest) => manifest.routes)
      .filter((route) => {
        try {
          return !statSync(resolve(process.cwd(), route.source)).isFile();
        } catch {
          return true;
        }
      });
    const registeredPaths = new Set(
      moduleRegistry.manifests.flatMap((manifest) =>
        manifest.routes.map((route) => route.path)
      )
    );
    const menuPaths = moduleRegistry.manifests.flatMap((manifest) =>
      manifest.navigation.map((item) => item.href)
    );

    expect(missingRoutes).toEqual([]);
    expect(menuPaths.filter((path) => !registeredPaths.has(path))).toEqual([]);
  });
});

describe("module source boundaries", () => {
  it("uses public feature APIs and declared cross-feature dependencies", () => {
    const violations: string[] = [];
    const files = collectSourceFiles(sourceRoot);

    for (const file of files) {
      const sourceModule = getOwningFeature(file);
      const source = readFileSync(file, "utf8");

      for (const match of source.matchAll(importPattern)) {
        const target = match[1] as ModuleId | undefined;
        const deepPath = match[2];
        if (!target || !MODULE_IDS.includes(target)) {
          continue;
        }

        const sourcePath = relative(process.cwd(), file).split(sep).join("/");
        const isRegistryManifestImport =
          sourcePath === "src/modules/registry.ts" && deepPath === "/manifest";
        const isPublicRuntimeEntry =
          deepPath !== undefined && publicRuntimeEntries.has(deepPath);
        const isSameFeature = sourceModule === target;

        if (
          deepPath &&
          !isSameFeature &&
          !isRegistryManifestImport &&
          !isPublicRuntimeEntry
        ) {
          violations.push(`${sourcePath}: 跨模块深层导入 ${target}${deepPath}`);
          continue;
        }

        if (sourceModule && !isSameFeature) {
          const dependencies =
            moduleRegistry.byId.get(sourceModule)?.dependencies;
          if (!dependencies?.includes(target)) {
            violations.push(
              `${sourcePath}: ${sourceModule} 未声明依赖 ${target}`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
