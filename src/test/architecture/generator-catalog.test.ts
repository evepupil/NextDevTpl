import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { serviceAdapterRegistry } from "@/adapters";
import { moduleRegistry } from "@/modules";
import { loadCatalog } from "../../../packages/create-nextdevtpl/src/catalog";

describe("generator catalog", () => {
  it("matches the live module and adapter registries", async () => {
    const catalog = await loadCatalog(resolve("recipes/catalog.json"));

    expect(Object.keys(catalog.modules).sort()).toEqual(
      moduleRegistry.manifests.map(({ id }) => id).sort()
    );
    expect(Object.keys(catalog.adapters).sort()).toEqual(
      serviceAdapterRegistry.map(({ id }) => id).sort()
    );
    for (const manifest of moduleRegistry.manifests) {
      expect(catalog.modules[manifest.id]?.dependencies).toEqual(
        manifest.dependencies
      );
    }
  });
});
