import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { serviceAdapterRegistry } from "@/adapters";
import { moduleRegistry } from "@/modules";
import {
  loadCatalog,
  validateCatalog,
} from "../../../packages/create-nextdevtpl/src/catalog";

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
      expect(catalog.modules[manifest.id]?.translations).toEqual(
        manifest.translations
      );
    }
  });

  it("validates the complete source and configuration closure", async () => {
    const catalog = await loadCatalog(resolve("recipes/catalog.json"));
    await expect(
      validateCatalog(catalog, { templateRoot: resolve(".") })
    ).resolves.toEqual([]);
  });

  it("rejects Windows path traversal and directory-only module references", async () => {
    const catalog = await loadCatalog(resolve("recipes/catalog.json"));
    const dashboardModule = catalog.modules.dashboard;
    const paymentAdapter = catalog.adapters["payment:creem"];
    if (!dashboardModule || !paymentAdapter) {
      throw new Error("catalog fixtures are missing");
    }

    const errors = await validateCatalog(
      {
        ...catalog,
        modules: {
          ...catalog.modules,
          dashboard: {
            ...dashboardModule,
            routes: ["src\\..\\outside.ts", "src"],
          },
        },
        adapters: {
          ...catalog.adapters,
          "payment:invalid": {
            ...paymentAdapter,
            source: "src\\..\\outside.ts",
          },
        },
      },
      { templateRoot: resolve(".") }
    );

    expect(errors).toContain(
      "模块 dashboard 包含无效路由源码路径 src\\..\\outside.ts"
    );
    expect(errors).toContain(
      "模块 dashboard 引用不存在的路由源码 src\\..\\outside.ts"
    );
    expect(errors).toContain("模块 dashboard 引用不存在的路由源码 src");
    expect(errors).toContain(
      "适配器 payment:invalid 包含无效源码路径 src\\..\\outside.ts"
    );
  });
});
