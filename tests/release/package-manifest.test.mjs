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
  "template/manifest.json",
  "template/README.en.md",
  "template/package.json",
  "template/pnpm-lock.yaml",
  "template/src/middleware.ts",
].map((path) => ({ path }));

const packageJson = {
  name: "create-nextdevtpl",
  version: "2.6.0",
  publishConfig: { access: "public" },
};
const roadmap = "# Roadmap\n\n> 当前版本：`v2.6.0`\n";

describe("release package manifest", () => {
  it("reads the current roadmap version", () => {
    expect(readRoadmapVersion(roadmap)).toBe("2.6.0");
  });

  it("accepts a complete public package", () => {
    expect(
      validateReleasePackage({ files: requiredFiles, packageJson, roadmap })
    ).toEqual({
      fileCount: requiredFiles.length,
      name: "create-nextdevtpl",
      version: "2.6.0",
    });
  });

  it("rejects version drift and private files", () => {
    expect(() =>
      validateReleasePackage({
        files: [...requiredFiles, { path: "template/.env.local" }],
        packageJson: { ...packageJson, version: "2.5.0" },
        roadmap,
      })
    ).toThrowError(/does not match roadmap 2\.6\.0[\s\S]*\.env\.local/);
  });
});
