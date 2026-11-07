import { describe, expect, it } from "vitest";

import { loadCatalog } from "../../packages/create-nextdevtpl/src/catalog";
import { createProjectSelection } from "../../packages/create-nextdevtpl/src/selection";
import {
  findActiveExemption,
  loadCompatibilityExemptions,
  loadCompatibilityMatrix,
} from "./matrix";

describe("official compatibility matrix", () => {
  const baseCase = {
    id: "fixture-server",
    preset: "minimal",
    target: "server",
    buildScript: "build",
    healthCheck: true,
    requiredPaths: ["package.json"],
    forbiddenPaths: [],
  };

  it.each([
    { kind: "builtin", id: "default" },
    { kind: "local", directory: "tests/fixtures/skins/contrast" },
    {
      kind: "remote",
      url: "https://skins.example.test/skin.tgz",
      sha256: "a".repeat(64),
    },
  ])("parses the supported skin source $kind", (skin) => {
    const [result] = loadCompatibilityMatrix({
      version: 1,
      cases: [{ ...baseCase, skin }],
    });
    expect(result?.skin).toEqual(skin);
  });

  it.each([
    { id: "../outside" },
    { skin: { kind: "builtin" } },
    { skin: { kind: "remote", url: "https://skins.example.test/skin.tgz" } },
    { skin: { kind: "unknown" } },
    { adapterOverrides: { payment: 42 } },
    { requiredPaths: [42] },
    { forbiddenPaths: [42] },
    { healthCheck: "true" },
    { mode: "demo" },
  ])("rejects invalid matrix data before generation: %j", (overrides) => {
    expect(() =>
      loadCompatibilityMatrix({
        version: 1,
        cases: [{ ...baseCase, ...overrides }],
      })
    ).toThrow();
  });

  it("rejects duplicate case IDs before creating output paths", () => {
    expect(() =>
      loadCompatibilityMatrix({ version: 1, cases: [baseCase, baseCase] })
    ).toThrow("Duplicate compatibility case ID");
  });

  it("keeps target coverage and includes the 4.x composition cases", () => {
    const matrix = loadCompatibilityMatrix();

    expect(matrix.map(({ id }) => id)).toEqual([
      "minimal-server",
      "saas-docker",
      "saas-vercel",
      "ai-saas-cloudflare",
      "operations-server",
      "operations-docker",
      "operations-vercel",
      "operations-cloudflare",
      "skin-local-server",
      "palette-minimal-server",
      "demo-minimal-server",
      "demo-palette-server",
    ]);
    expect(new Set(matrix.map(({ target }) => target))).toEqual(
      new Set(["server", "docker", "vercel", "cloudflare"])
    );
    expect(
      matrix.filter(({ mode }) => mode === "demo").map(({ id }) => id)
    ).toEqual(["demo-minimal-server", "demo-palette-server"]);
  });

  it("resolves every full case through the production selection rules", async () => {
    const catalog = await loadCatalog("recipes/catalog.json");

    for (const matrixCase of loadCompatibilityMatrix().filter(
      ({ mode }) => mode !== "demo"
    )) {
      if (!matrixCase.preset)
        throw new Error(`${matrixCase.id} needs a preset`);
      const selection = createProjectSelection(catalog, {
        preset: matrixCase.preset,
        ...(matrixCase.modules ? { modules: matrixCase.modules } : {}),
        ...(matrixCase.adapterOverrides
          ? { adapterOverrides: matrixCase.adapterOverrides }
          : {}),
        target: matrixCase.target,
      });

      expect(selection.preset).toBe(matrixCase.preset);
      expect(selection.target).toBe(matrixCase.target);
      expect(selection.modules.length).toBeGreaterThan(0);
      expect(selection.adapters["rate-limit"]).toBeDefined();
    }
  });

  it("keeps demo cases free of backend selection inputs", () => {
    const demos = loadCompatibilityMatrix().filter(
      ({ mode }) => mode === "demo"
    );

    expect(demos).toHaveLength(2);
    for (const matrixCase of demos) {
      expect(matrixCase.preset).toBeUndefined();
      expect(matrixCase.modules).toBeUndefined();
      expect(matrixCase.adapterOverrides).toBeUndefined();
      expect(matrixCase.target).toBe("server");
      expect(matrixCase.healthCheck).toBe(false);
      expect(matrixCase.expectedPreset).toBe("custom");
    }
  });

  it("starts without temporary release exemptions", () => {
    expect(loadCompatibilityExemptions()).toEqual([]);
    expect(findActiveExemption("minimal-server", "build")).toBeUndefined();
  });
});
