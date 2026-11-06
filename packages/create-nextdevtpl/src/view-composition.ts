import { isAbsolute, relative, resolve, sep } from "node:path";

import { removePath, writeText } from "./filesystem.js";
import type { CatalogModule, RecipeCatalog } from "./types.js";

interface SelectedViewModule {
  id: string;
  recipe: CatalogModule;
}

function moduleAlias(id: string): string {
  return id.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());
}

function sourceAlias(path: string): string {
  return `@/${path
    .replace(/^src\//u, "")
    .replace(/\/index\.tsx?$/u, "")
    .replace(/\.tsx?$/u, "")}`;
}

function modulesWithViews(
  selectedModules: readonly string[],
  catalog: RecipeCatalog
): SelectedViewModule[] {
  return selectedModules.flatMap((id) => {
    const recipe = catalog.modules[id];
    if (!recipe || !recipe.views || recipe.views.length === 0) return [];
    if (!recipe.viewContract || !recipe.skinEntry) {
      throw new Error(`Module ${id} has incomplete view entry metadata`);
    }
    return [{ id, recipe }];
  });
}

export function createSelectedSkinViewsSource(
  selectedModules: readonly string[],
  catalog: RecipeCatalog,
  viewEntries?: Readonly<Record<string, string>>
): string {
  const modules = modulesWithViews(selectedModules, catalog);
  const imports = modules.flatMap(({ id, recipe }) => {
    const alias = moduleAlias(id);
    const entry = viewEntries?.[id]
      ? sourceAlias(`src/skin/${viewEntries[id]}`)
      : sourceAlias(recipe.skinEntry!);
    return [
      `import type { ViewContracts as ${alias}ViewContracts } from "${sourceAlias(recipe.viewContract!)}";`,
      `import { views as ${alias}Views } from "${entry}";`,
    ];
  });
  const contractAliases = modules.map(
    ({ id }) => `${moduleAlias(id)}ViewContracts`
  );
  const viewSpreads = modules.map(({ id }) => `  ...${moduleAlias(id)}Views,`);
  const contracts =
    contractAliases.length > 0 ? contractAliases.join(" & ") : "{}";

  return `${imports.join("\n")}${imports.length > 0 ? "\n\n" : ""}import type { SkinViews } from "@/core/skin";

export type SelectedViewContracts = ${contracts};

export const skinViews = {
${viewSpreads.join("\n")}
} satisfies SkinViews<SelectedViewContracts>;
`;
}

export async function writeSelectedSkinViews(
  target: string,
  selectedModules: readonly string[],
  catalog: RecipeCatalog,
  viewEntries?: Readonly<Record<string, string>>
): Promise<void> {
  await writeText(
    resolve(target, "src", "modules", "skin-views.ts"),
    createSelectedSkinViewsSource(selectedModules, catalog, viewEntries)
  );
}

export async function pruneUnselectedSkinSources(
  target: string,
  selectedModules: readonly string[],
  catalog: RecipeCatalog
): Promise<void> {
  const targetRoot = resolve(target);
  const skinRoot = resolve(targetRoot, "src", "skin");
  const selected = new Set(selectedModules);

  for (const [id, recipe] of Object.entries(catalog.modules)) {
    if (selected.has(id)) continue;
    for (const source of recipe.skinSources ?? []) {
      const path = resolve(targetRoot, ...source.split(/[\\/]/u));
      const relativePath = relative(skinRoot, path);
      if (
        relativePath === "" ||
        relativePath === ".." ||
        relativePath.startsWith(`..${sep}`) ||
        isAbsolute(relativePath)
      ) {
        throw new Error(`Skin source is outside src/skin: ${source}`);
      }
      await removePath(path);
    }
  }
}
