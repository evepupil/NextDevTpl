import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { loadCatalog } from "../../../packages/create-nextdevtpl/src/catalog";
import { createProjectSelection } from "../../../packages/create-nextdevtpl/src/selection";
import type { RecipeCatalog } from "../../../packages/create-nextdevtpl/src/types";

describe("project generator selection", () => {
  let catalog: RecipeCatalog;

  beforeAll(async () => {
    catalog = await loadCatalog(resolve("recipes/catalog.json"));
  });

  it("resolves the minimal module dependency closure", () => {
    const selection = createProjectSelection(catalog, { preset: "minimal" });

    expect(selection.modules).toEqual(["mail", "shared", "auth", "dashboard"]);
    expect(selection.adapters).toEqual({
      mail: "mail:disabled",
      "rate-limit": "rate-limit:noop",
    });
    expect(selection.bindings).toEqual([]);
  });

  it("rejects an adapter assigned to the wrong service", () => {
    expect(() =>
      createProjectSelection(catalog, {
        preset: "custom",
        adapterOverrides: { mail: "payment:creem" },
      })
    ).toThrow("does not provide mail");
  });

  it("rejects a Worker adapter on a server target", () => {
    expect(() =>
      createProjectSelection(catalog, {
        preset: "custom",
        adapterOverrides: { ai: "ai:workers-ai" },
      })
    ).toThrow("requires the Cloudflare target");
  });

  it("resolves the custom module closure and adapter packages", () => {
    const selection = createProjectSelection(catalog, {
      preset: "custom",
      modules: ["settings"],
      adapterOverrides: {
        payment: "payment:stripe",
        storage: "storage:s3-compatible",
      },
    });

    expect(selection.modules).toEqual([
      "subscription",
      "payment",
      "credits",
      "storage",
      "settings",
    ]);
    expect(selection.packages).toEqual([
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
    ]);
  });
});
