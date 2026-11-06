import { readdir } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

import { removePath } from "./filesystem.js";
import type { RecipeCatalog } from "./types.js";

const NEXT_ROUTE_FILES = new Set([
  "default.tsx",
  "error.tsx",
  "global-error.tsx",
  "layout.tsx",
  "loading.tsx",
  "middleware.ts",
  "not-found.tsx",
  "route.ts",
  "template.tsx",
]);

function withinPath(parent: string, candidate: string): boolean {
  const fromParent = relative(parent, candidate);
  return (
    fromParent === "" ||
    (!isAbsolute(fromParent) &&
      fromParent !== ".." &&
      !fromParent.startsWith(`..${sep}`))
  );
}

function resolveSource(target: string, source: string): string {
  return resolve(target, ...source.split(/[\\/]/u));
}

async function pruneUnselectedContent(
  directory: string,
  selectedRouteDirectories: readonly string[]
): Promise<void> {
  const selectedHere = selectedRouteDirectories.includes(directory);
  const selectedBelow = selectedRouteDirectories.some((routeDirectory) =>
    withinPath(directory, routeDirectory)
  );
  if (selectedHere) return;
  if (!selectedBelow) {
    await removePath(directory);
    return;
  }

  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await pruneUnselectedContent(entryPath, selectedRouteDirectories);
    } else if (!NEXT_ROUTE_FILES.has(basename(entryPath))) {
      await removePath(entryPath);
    }
  }
}

export async function pruneUnselectedRoutes(
  target: string,
  selectedModules: readonly string[],
  catalog: RecipeCatalog
): Promise<void> {
  const targetRoot = resolve(target);
  const appRoot = resolve(targetRoot, "src", "app");
  const selected = new Set(selectedModules);
  const selectedSources = selectedModules.flatMap(
    (id) => catalog.modules[id]?.routes ?? []
  );
  const selectedRouteDirectories = selectedSources.map((source) =>
    dirname(resolveSource(targetRoot, source))
  );
  const unselectedSources = Object.entries(catalog.modules).flatMap(
    ([id, module]) => (selected.has(id) ? [] : module.routes)
  );
  const candidateDirectories = new Set<string>();

  for (const source of unselectedSources) {
    const sourcePath = resolveSource(targetRoot, source);
    if (!withinPath(appRoot, sourcePath)) {
      throw new Error(`Route source is outside src/app: ${source}`);
    }
    await removePath(sourcePath);
    candidateDirectories.add(dirname(sourcePath));
  }

  for (const directory of [...candidateDirectories].sort(
    (left, right) => right.length - left.length
  )) {
    if (!withinPath(appRoot, directory) || directory === appRoot) {
      throw new Error(`Route directory is outside a removable route path`);
    }
    await pruneUnselectedContent(directory, selectedRouteDirectories);
  }

  for (const group of ["(admin)", "(marketing)", "(dashboard)"]) {
    const groupDirectory = resolve(appRoot, "[locale]", group);
    const hasSelectedRoute = selectedSources.some((source) =>
      withinPath(groupDirectory, resolveSource(targetRoot, source))
    );
    if (!hasSelectedRoute) await removePath(groupDirectory);
  }
}
