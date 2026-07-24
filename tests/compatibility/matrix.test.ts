import { describe, expect, it } from "vitest";

import { loadCatalog } from "../../packages/create-nextdevtpl/src/catalog";
import { createProjectSelection } from "../../packages/create-nextdevtpl/src/selection";
import {
  findActiveExemption,
  loadCompatibilityExemptions,
  loadCompatibilityMatrix,
} from "./matrix";

describe("official compatibility matrix", () => {
  it("covers every supported deployment target exactly once", () => {
    const matrix = loadCompatibilityMatrix();

    expect(matrix.map(({ id }) => id)).toEqual([
      "minimal-server",
      "saas-docker",
      "saas-vercel",
      "ai-saas-cloudflare",
    ]);
    expect(matrix.map(({ target }) => target).sort()).toEqual([
      "cloudflare",
      "docker",
      "server",
      "vercel",
    ]);
  });

  it("resolves every case through the production selection rules", async () => {
    const catalog = await loadCatalog("recipes/catalog.json");

    for (const matrixCase of loadCompatibilityMatrix()) {
      const selection = createProjectSelection(catalog, {
        preset: matrixCase.preset,
        target: matrixCase.target,
      });

      expect(selection.preset).toBe(matrixCase.preset);
      expect(selection.target).toBe(matrixCase.target);
      expect(selection.modules.length).toBeGreaterThan(0);
      expect(selection.adapters["rate-limit"]).toBeDefined();
    }
  });

  it("starts without temporary release exemptions", () => {
    expect(loadCompatibilityExemptions()).toEqual([]);
    expect(findActiveExemption("minimal-server", "build")).toBeUndefined();
  });
});
