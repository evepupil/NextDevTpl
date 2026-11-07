import type { ValidatedSkin } from "../skins/types.js";
import type { RecipeCatalog } from "../types.js";
import { validateDemoViewComponents } from "./components.js";
import { analyzeDemoClientSources } from "./graph.js";

export async function validateDemoClientViews(
  skin: ValidatedSkin,
  catalog: RecipeCatalog
): Promise<void> {
  const analysis = await analyzeDemoClientSources(skin, catalog);
  validateDemoViewComponents(skin, analysis);
}
