import { describe, expect, it } from "vitest";

import {
  readRoadmapVersion,
  validateReleasePackage,
} from "../../scripts/release/package-manifest.mjs";

const requiredFiles = [
  "README.md",
  "README.en.md",
  "catalog.json",
  "dist/cli.js",
  "dist/index.js",
  "package.json",
  "palettes/licenses/stylekit-MIT.txt",
  "palettes/stylekit/LICENSE",
  "palettes/stylekit/normalized/glassmorphism.json",
  "palettes/stylekit/registry.json",
  "palettes/stylekit/snapshot.json",
  "palettes/stylekit/themes/glassmorphism.json",
  "template/manifest.json",
  "template/README.md",
  "template/README.en.md",
  "template/package.json",
  "template/pnpm-lock.yaml",
  "template/src/core/skin/demo/index.ts",
  "template/src/core/skin/demo/schema.ts",
  "template/src/core/skin/version.json",
  "template/src/middleware.ts",
  "template/src/modules/app-runtime.tsx",
  "template/src/modules/demo-skin-views.ts",
  "template/src/modules/view-pages.tsx",
  "template/src/skin/skin.json",
  "template/src/skin/tokens.css",
].map((path) => ({ path }));

const packageJson = {
  name: "create-nextdevtpl",
  version: "4.0.0",
  publishConfig: { access: "public" },
};
const roadmap = "# Roadmap\n\n> 当前版本：`v4.0.0`\n";

describe("release package manifest", () => {
  it("reads the current roadmap version", () => {
    expect(readRoadmapVersion(roadmap)).toBe("4.0.0");
  });

  it("accepts a complete public package", () => {
    expect(
      validateReleasePackage({ files: requiredFiles, packageJson, roadmap })
    ).toEqual({
      fileCount: requiredFiles.length,
      name: "create-nextdevtpl",
      version: "4.0.0",
    });
  });

  it("requires the skin, palette, and demo sources in the package", () => {
    const withoutPaletteSnapshot = requiredFiles.filter(
      ({ path }) => path !== "palettes/stylekit/snapshot.json"
    );

    expect(() =>
      validateReleasePackage({
        files: withoutPaletteSnapshot,
        packageJson,
        roadmap,
      })
    ).toThrowError(/release package is missing palettes\/stylekit\/snapshot\.json/);
  });

  it("requires the skin version contract in the package", () => {
    const withoutSkinVersion = requiredFiles.filter(
      ({ path }) => path !== "template/src/core/skin/version.json"
    );

    expect(() =>
      validateReleasePackage({
        files: withoutSkinVersion,
        packageJson,
        roadmap,
      })
    ).toThrowError(
      /release package is missing template\/src\/core\/skin\/version\.json/
    );
  });

  it("rejects an additional runtime file missing from the package listing", () => {
    expect(() =>
      validateReleasePackage({
        files: requiredFiles,
        packageJson,
        roadmap,
        requiredRuntimeFiles: ["dist/demo-generation.js"],
      })
    ).toThrowError(/release package is missing dist\/demo-generation\.js/);
  });

  it("rejects version drift and private files", () => {
    expect(() =>
      validateReleasePackage({
        files: [...requiredFiles, { path: "template/.env.local" }],
        packageJson: { ...packageJson, version: "3.0.0" },
        roadmap,
      })
    ).toThrowError(/does not match roadmap 4\.0\.0[\s\S]*\.env\.local/);
  });

  it("requires public package metadata", () => {
    expect(() =>
      validateReleasePackage({
        files: requiredFiles,
        packageJson: { ...packageJson, private: true },
        roadmap,
      })
    ).toThrowError(/release package must not be private/);

    expect(() =>
      validateReleasePackage({
        files: requiredFiles,
        packageJson: {
          ...packageJson,
          publishConfig: { access: "restricted" },
        },
        roadmap,
      })
    ).toThrowError(/release package must declare public access/);
  });
});
