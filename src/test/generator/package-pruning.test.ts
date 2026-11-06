import { describe, expect, it } from "vitest";

import { pruneRepositoryOnlyPackageEntries } from "../../../packages/create-nextdevtpl/src/package-pruning";

// 构造一份带仓库专用截图基线条目的 package.json，避免依赖仓库根
// package.json 此刻是否已经加上这些条目。
function buildRepositoryPackageJson() {
  return {
    name: "NextjsTpl",
    private: true,
    dependencies: {
      next: "^16.2.11",
      react: "^19.2.0",
    },
    devDependencies: {
      "@biomejs/biome": "^2.3.11",
      "@playwright/test": "^1.51.1",
      typescript: "^5",
      vitest: "^4.0.18",
    },
    scripts: {
      dev: "next dev --turbopack",
      build: "next build --webpack",
      test: "vitest",
      "test:run": "vitest run",
      "visual:baseline": "playwright test --update-snapshots",
      "visual:check": "playwright test",
      "visual:db:down": "docker compose -f e2e/docker-compose.yml down",
    },
  };
}

describe("pruneRepositoryOnlyPackageEntries", () => {
  it("removes the repository-only playwright devDependency and visual scripts", () => {
    const packageJson = pruneRepositoryOnlyPackageEntries(
      buildRepositoryPackageJson()
    );

    expect(packageJson.devDependencies).not.toHaveProperty("@playwright/test");
    expect(Object.keys(packageJson.scripts)).not.toContain("visual:baseline");
    expect(Object.keys(packageJson.scripts)).not.toContain("visual:check");
    expect(Object.keys(packageJson.scripts)).not.toContain("visual:db:down");
    expect(
      Object.keys(packageJson.scripts).filter((name) =>
        name.startsWith("visual:")
      )
    ).toEqual([]);
  });

  it("keeps every other dependency and script untouched", () => {
    const input = buildRepositoryPackageJson();
    const packageJson = pruneRepositoryOnlyPackageEntries(
      buildRepositoryPackageJson()
    );

    expect(packageJson.name).toBe(input.name);
    expect(packageJson.private).toBe(input.private);
    expect(packageJson.dependencies).toEqual(input.dependencies);
    expect(packageJson.devDependencies).toEqual({
      "@biomejs/biome": "^2.3.11",
      typescript: "^5",
      vitest: "^4.0.18",
    });
    expect(packageJson.scripts.dev).toBe(input.scripts.dev);
    expect(packageJson.scripts.build).toBe(input.scripts.build);
    expect(packageJson.scripts["test:run"]).toBe(input.scripts["test:run"]);
  });

  it("prunes any script matching the visual: prefix", () => {
    const packageJson = pruneRepositoryOnlyPackageEntries({
      devDependencies: {},
      scripts: {
        dev: "next dev --turbopack",
        "visual:anything-new": "playwright test something",
        "visual:a": "echo a",
        "visual:b": "echo b",
      },
    });

    expect(Object.keys(packageJson.scripts)).toEqual(["dev"]);
  });

  it("tolerates a package.json without visual entries or sections", () => {
    const packageJson = pruneRepositoryOnlyPackageEntries({
      devDependencies: { typescript: "^5" },
      scripts: { dev: "next dev --turbopack", build: "next build" },
    });

    expect(packageJson).toEqual({
      devDependencies: { typescript: "^5" },
      scripts: { dev: "next dev --turbopack", build: "next build" },
    });
    expect(() =>
      pruneRepositoryOnlyPackageEntries<Record<string, unknown>>({
        name: "bare",
      })
    ).not.toThrow();
  });
});
