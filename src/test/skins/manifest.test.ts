import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseSkinManifest,
  readSkinManifest,
} from "../../../packages/create-nextdevtpl/src/skins";
import { createSkinFixture, createSkinManifest } from "./skin-fixture";

describe("skin manifest parsing", () => {
  it("accepts a complete manifest with exact dependency versions", () => {
    const manifest = createSkinManifest({
      dependencies: { "lucide-react": "0.562.0" },
    });

    expect(parseSkinManifest(manifest)).toMatchObject({
      compatibility: { template: "^4.0.0", viewApi: 1 },
      dependencies: { "lucide-react": "0.562.0" },
      id: "test-skin",
      schemaVersion: 1,
      version: "1.2.3",
    });
  });

  it("requires dependency asset metadata to match the pinned package version", () => {
    const dependencyAsset = {
      id: "skin-font",
      kind: "dependency",
      author: "Font Provider",
      source: "https://font.example.test",
      license: "OFL-1.1",
      purpose: "functional",
      package: { name: "@fontsource/example", version: "5.2.0" },
    } as const;

    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        dependencies: { "@fontsource/example": "5.2.0" },
        assets: [dependencyAsset],
      })
    ).not.toThrow();

    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        dependencies: { "@fontsource/example": "5.2.1" },
        assets: [dependencyAsset],
      })
    ).toThrow();
  });

  it.each([
    ["root field", { unexpected: true }],
    [
      "compatibility field",
      { compatibility: { template: "^4.0.0", viewApi: 1, next: "4" } },
    ],
    [
      "customization field",
      {
        customization: {
          ...createSkinManifest().customization,
          fontPackage: "x",
        },
      },
    ],
    [
      "asset field",
      {
        assets: [
          {
            id: "logo",
            kind: "inline",
            author: "Example",
            source: "https://example.test/logo",
            license: "CC0-1.0",
            purpose: "visual",
            extra: true,
          },
        ],
      },
    ],
  ])("rejects unknown %s", (_label, extra) => {
    expect(() =>
      parseSkinManifest({ ...createSkinManifest(), ...extra })
    ).toThrow();
  });

  it.each([
    "v1.2.3",
    "1.2",
    "1.2.3-beta.1",
    "latest",
  ])("rejects an unpublished or non-strict skin version: %s", (version) => {
    expect(() =>
      parseSkinManifest({ ...createSkinManifest(), version })
    ).toThrow();
  });

  it.each([
    "latest",
    "4.x.invalid",
    ">=invalid",
  ])("rejects an invalid template compatibility range: %s", (template) => {
    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        compatibility: { template, viewApi: 1 },
      })
    ).toThrow();
  });

  it.each([
    "^4",
    "4.0.0 || *",
  ])("accepts a standard semantic compatibility range: %s", (template) => {
    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        compatibility: { template, viewApi: 1 },
      })
    ).not.toThrow();
  });

  it.each([
    "^1.2.3",
    "~1.2.3",
    "*",
    "latest",
    "1.2",
  ])("rejects a dependency that is not pinned to one exact version: %s", (version) => {
    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        dependencies: { "some-package": version },
      })
    ).toThrow();
  });

  it("rejects assets without author, source, license, or purpose attribution", () => {
    const missingLicense = {
      id: "brand-mark",
      kind: "file",
      author: "Example",
      source: "https://example.test/brand-mark",
      purpose: "functional",
      files: ["assets/brand-mark.svg"],
    };

    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        assets: [missingLicense],
      })
    ).toThrow();
  });

  it("rejects credential-bearing asset source URLs", () => {
    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        assets: [
          {
            id: "private-image",
            kind: "inline",
            author: "Example",
            source: "https://assets.example.test/icon.svg?access_token=secret",
            license: "CC0-1.0",
            purpose: "visual",
          },
        ],
      })
    ).toThrow();
  });

  it("reads a valid manifest from the package directory", async () => {
    const fixture = await createSkinFixture();
    try {
      await expect(readSkinManifest(fixture.directory)).resolves.toMatchObject({
        id: "test-skin",
        schemaVersion: 1,
        viewEntries: { shared: "views/shared/index.tsx" },
      });
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects duplicate JSON keys when reading the manifest file", async () => {
    const fixture = await createSkinFixture();
    try {
      const source = JSON.stringify(fixture.manifest, null, 2).replace(
        '"schemaVersion": 1,',
        '"schemaVersion": 1,\n  "schemaVersion": 1,'
      );
      await writeFile(join(fixture.directory, "skin.json"), source, "utf8");

      await expect(readSkinManifest(fixture.directory)).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it.each([
    "skin.json/../tokens.css",
    "assets/CON.txt",
    "assets/trailing.",
  ])("rejects a non-canonical package file path: %s", (path) => {
    expect(() =>
      parseSkinManifest({
        ...createSkinManifest(),
        files: { [path]: "0".repeat(64) },
      })
    ).toThrow();
  });
});
