import { createHash } from "node:crypto";
import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  applySkinPackage,
  validateSkinPackage,
} from "../../../packages/create-nextdevtpl/src/skins";
import { createSkinCatalog, createSkinFixture } from "./skin-fixture";

describe("skin package validation", () => {
  it("accepts a package covering the selected module views", async () => {
    const fixture = await createSkinFixture();
    try {
      await expect(fixture.validate()).resolves.toMatchObject({
        manifest: { modules: ["shared"] },
      });
    } finally {
      await fixture.dispose();
    }
  });

  it("applies selected skin views and registered core component overrides", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        modules: ["shared", "dashboard"],
        viewEntries: {
          shared: "views/shared/index.tsx",
          dashboard: "views/dashboard/index.tsx",
        },
        uiOverrides: { "button.tsx": "ui/button.tsx" },
      },
      skinFiles: {
        "views/dashboard/index.tsx": [
          "const DashboardOverview = () => null;",
          'export const views = { "dashboard.overview": DashboardOverview };',
        ].join("\n"),
        "ui/button.tsx": "export function Button() { return null; }\n",
      },
    });
    try {
      const skin = await fixture.validate();
      await applySkinPackage({
        skin,
        targetDirectory: fixture.templateDirectory,
        catalog: fixture.catalog,
        selectedModules: ["shared"],
      });

      await expect(
        readFile(
          join(fixture.templateDirectory, "src/skin/views/shared/index.tsx"),
          "utf8"
        )
      ).resolves.toContain("shared.dashboard-layout");
      const buttonSource = await readFile(
        join(fixture.templateDirectory, "src/components/ui/button.tsx"),
        "utf8"
      );
      expect(
        buttonSource.includes("export function Button") ||
          buttonSource.includes("@/skin/ui/button")
      ).toBe(true);
      await expect(
        access(
          join(fixture.templateDirectory, "src/skin/views/dashboard/index.tsx")
        )
      ).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("uses the full validation template when applying to a pruned project", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        modules: ["shared", "dashboard"],
        viewEntries: {
          shared: "views/shared/index.tsx",
          dashboard: "views/dashboard/index.tsx",
        },
      },
      skinFiles: {
        "views/dashboard/index.tsx": [
          'import type { DashboardViewProps } from "@/features/dashboard/view";',
          "const DashboardOverview = (_props: DashboardViewProps) => null;",
          'export const views = { "dashboard.overview": DashboardOverview };',
        ].join("\n"),
      },
    });
    try {
      const skin = await fixture.validate();
      const targetDirectory = join(fixture.root, "minimal-project");
      await cp(fixture.templateDirectory, targetDirectory, { recursive: true });
      await rm(join(targetDirectory, "src/features/dashboard"), {
        recursive: true,
        force: true,
      });
      await applySkinPackage({
        skin,
        targetDirectory,
        catalog: fixture.catalog,
        selectedModules: ["shared"],
      });
      await expect(
        access(join(targetDirectory, "src/skin/views/shared/index.tsx"))
      ).resolves.toBeUndefined();
      await expect(
        access(join(targetDirectory, "src/skin/views/dashboard/index.tsx"))
      ).rejects.toThrow();
      const output = await validateSkinPackage({
        directory: join(targetDirectory, "src/skin"),
        templateDirectory: targetDirectory,
        catalog: fixture.catalog,
        selectedModules: ["shared"],
      });
      expect(output.manifest.modules).toEqual(["shared"]);
      expect(output.manifest.viewEntries).toEqual({
        shared: "views/shared/index.tsx",
      });
      await expect(
        access(
          join(
            fixture.templateDirectory,
            "src/features/dashboard/view/index.ts"
          )
        )
      ).resolves.toBeUndefined();
    } finally {
      await fixture.dispose();
    }
  });

  it("retains font, CSS, and overridden component helpers with the style guide", async () => {
    const fixture = await createSkinFixture({
      manifest: { uiOverrides: { "button.tsx": "ui/button.tsx" } },
      skinFiles: {
        "fonts.ts": 'export { fontClassName } from "./layouts/fonts";\n',
        "layouts/fonts.ts": 'export const fontClassName = "";\n',
        "tokens.css": '@import "./layouts/colors.css";\n',
        "layouts/colors.css": ":root { --background: #fff; }\n",
        "ui/button.tsx": [
          'import { buttonLabel } from "./helpers";',
          "export function Button() { return buttonLabel; }",
        ].join("\n"),
        "ui/helpers.ts": 'export const buttonLabel = "Overridden";\n',
        "DESIGN.md": "# Fixture style guide\n",
      },
    });
    try {
      const skin = await fixture.validate();
      await applySkinPackage({
        skin,
        targetDirectory: fixture.templateDirectory,
        catalog: fixture.catalog,
        selectedModules: fixture.selectedModules,
      });
      for (const file of [
        "layouts/fonts.ts",
        "layouts/colors.css",
        "ui/button.tsx",
        "ui/helpers.ts",
        "DESIGN.md",
      ]) {
        await expect(
          access(join(fixture.templateDirectory, "src/skin", file))
        ).resolves.toBeUndefined();
      }
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects applying a package whose files changed after validation", async () => {
    const fixture = await createSkinFixture();
    try {
      const skin = await fixture.validate();
      await fixture.writeSkinFile(
        "tokens.css",
        ":root { --skin-test-color: #abcdef; }\n"
      );

      await expect(
        applySkinPackage({
          skin,
          targetDirectory: fixture.templateDirectory,
          catalog: fixture.catalog,
          selectedModules: fixture.selectedModules,
        })
      ).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects selected modules the skin does not support", async () => {
    const fixture = await createSkinFixture({
      selectedModules: ["shared", "dashboard"],
    });
    try {
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects view entry module keys that do not match declared views", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        modules: ["shared", "dashboard"],
        viewEntries: {
          shared: "views/shared/index.tsx",
          dashboard: "views/dashboard/index.tsx",
        },
      },
      skinFiles: {
        "views/dashboard/index.tsx":
          'export const views = { "dashboard.overview": Dashboard };',
      },
      selectedModules: ["shared", "dashboard"],
    });
    try {
      await fixture.refreshHashes();
      await fixture.writeManifest({
        ...fixture.manifest,
        modules: ["shared"],
        viewEntries: {
          shared: "views/shared/index.tsx",
          dashboard: "views/dashboard/index.tsx",
        },
      });

      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("requires an entry for every selected module that declares views", async () => {
    const fixture = await createSkinFixture({
      manifest: { viewEntries: {} },
    });
    try {
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("does not permit a view entry for a selected module with no registered views", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        modules: ["shared", "credits"],
        viewEntries: {
          shared: "views/shared/index.tsx",
          credits: "views/credits/index.tsx",
        },
      },
      skinFiles: {
        "views/credits/index.tsx": "export const views = {};\n",
      },
      selectedModules: ["shared", "credits"],
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("allows supported modules without views to omit view entries", async () => {
    const catalog = createSkinCatalog();
    const fixture = await createSkinFixture({
      catalog,
      manifest: { modules: ["shared", "credits"] },
      selectedModules: ["shared", "credits"],
    });
    try {
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it.each([
    ["absolute POSIX path", "/views/shared/index.tsx"],
    ["Windows drive path", "C:\\skins\\views\\index.tsx"],
    ["Windows drive-relative path", "C:views\\index.tsx"],
    ["UNC path", "\\\\server\\share\\views\\index.tsx"],
    ["backslash separators", "views\\shared\\index.tsx"],
    ["parent traversal", "views/shared/../../../outside.tsx"],
    ["wrong extension", "views/shared/index.js"],
  ])("rejects a view entry using %s", async (_label, entry) => {
    const fixture = await createSkinFixture();
    try {
      await fixture.writeManifest({
        ...fixture.manifest,
        viewEntries: { shared: entry },
      });
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects source files outside the skin directory whitelist", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "scripts/install.ts": "export function install() {}\n",
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("checks restricted imports in font source files, not only view entries", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "fonts.ts": [
          'import { readFile } from "node:fs/promises";',
          "export const fontClassName = String(readFile);",
        ].join("\n"),
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects a files map with an extra path outside the package", async () => {
    const fixture = await createSkinFixture();
    try {
      await fixture.writeManifest({
        ...fixture.manifest,
        files: {
          ...fixture.manifest.files,
          "../outside.txt": "0".repeat(64),
        },
      });
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects a file whose contents no longer match its declared hash", async () => {
    const fixture = await createSkinFixture();
    try {
      await fixture.writeSkinFile("tokens.css", ":root { color: red; }\n");
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects a files map that omits an ordinary package file", async () => {
    const fixture = await createSkinFixture();
    try {
      const files = Object.fromEntries(
        Object.entries(fixture.manifest.files).filter(
          ([path]) => path !== "tokens.css"
        )
      );
      await fixture.writeManifest({ ...fixture.manifest, files });

      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("requires file assets to have complete attribution and point to package files", async () => {
    const fixture = await createSkinFixture({
      skinFiles: { "assets/brand.svg": "<svg />\n" },
      manifest: {
        assets: [
          {
            id: "brand",
            kind: "file",
            author: "Example",
            source: "https://example.test/brand.svg",
            license: "CC0-1.0",
            purpose: "visual",
            files: ["assets/missing.svg"],
          },
        ],
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects unregistered material files even when their hashes are present", async () => {
    const fixture = await createSkinFixture({
      skinFiles: { "assets/brand.svg": "<svg />\n" },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("accepts and hashes an attributed file asset", async () => {
    const fixture = await createSkinFixture({
      skinFiles: { "assets/brand.svg": "<svg />\n" },
      manifest: {
        assets: [
          {
            id: "brand",
            kind: "file",
            author: "Example",
            source: "https://example.test/brand.svg",
            license: "CC0-1.0",
            purpose: "visual",
            files: ["assets/brand.svg"],
          },
        ],
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it("uses raw bytes for file hashes and excludes the manifest itself", async () => {
    const rawFile = new Uint8Array([0, 255, 10, 13, 128]);
    const fixture = await createSkinFixture({
      skinFiles: { "assets/raw.png": rawFile },
      manifest: {
        assets: [
          {
            id: "raw-image",
            kind: "file",
            author: "Example",
            source: "https://example.test/raw.png",
            license: "CC0-1.0",
            purpose: "visual",
            files: ["assets/raw.png"],
          },
        ],
      },
    });
    try {
      const refreshed = await fixture.refreshHashes();
      const expected = createHash("sha256").update(rawFile).digest("hex");

      expect(refreshed.files["assets/raw.png"]).toBe(expected);
      expect(refreshed.files).not.toHaveProperty("skin.json");
    } finally {
      await fixture.dispose();
    }
  });

  it("changes the package fingerprint when a view entry changes", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "views/shared/alternate.tsx": [
          "const DashboardLayout = () => null;",
          "const EmptyDashboard = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          '  "shared.empty-dashboard": EmptyDashboard,',
          "};",
        ].join("\n"),
      },
    });
    try {
      const first = await fixture.validate();
      await fixture.writeManifest({
        ...fixture.manifest,
        viewEntries: { shared: "views/shared/alternate.tsx" },
      });
      const second = await fixture.validate();

      expect(second.packageHash).not.toBe(first.packageHash);
    } finally {
      await fixture.dispose();
    }
  });

  it("does not change the package fingerprint when JSON key order changes", async () => {
    const fixture = await createSkinFixture();
    try {
      const first = await fixture.validate();
      const reorderedManifest = Object.fromEntries(
        Object.entries(fixture.manifest).reverse()
      );
      await fixture.writeManifest(reorderedManifest);
      const second = await fixture.validate();

      expect(second.packageHash).toBe(first.packageHash);
    } finally {
      await fixture.dispose();
    }
  });

  it.each([
    [
      "template version outside declared range",
      {
        manifest: {
          compatibility: { template: "^3.0.0", viewApi: 1 },
        },
      },
    ],
    [
      "view API newer than the template",
      {
        manifest: {
          compatibility: { template: "^4.0.0", viewApi: 2 },
        },
      },
    ],
  ])("rejects %s", async (_label, options) => {
    const fixture = await createSkinFixture(options);
    try {
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("uses template version metadata instead of the CLI package version", async () => {
    const fixture = await createSkinFixture({
      templateFiles: {
        "package.json": JSON.stringify({
          version: "9.9.9",
          dependencies: {
            "lucide-react": "0.562.0",
            next: "16.2.11",
            react: "19.2.3",
          },
        }),
      },
    });
    try {
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects a dependency pinned to a conflicting core major", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        dependencies: { react: "18.2.0" },
      },
    });
    try {
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects modules that are not in the template catalog", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        modules: ["shared", "unknown-module"],
      },
    });
    try {
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects an override for an unknown core component", async () => {
    const fixture = await createSkinFixture({
      manifest: {
        uiOverrides: { "application-shell.tsx": "ui/application-shell.tsx" },
      },
      skinFiles: {
        "ui/application-shell.tsx":
          "export default function Shell() { return null; }\n",
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects a registered override whose source file is missing", async () => {
    const fixture = await createSkinFixture({
      manifest: { uiOverrides: { "button.tsx": "ui/button.tsx" } },
    });
    try {
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("accepts an override of a registered core component", async () => {
    const fixture = await createSkinFixture({
      manifest: { uiOverrides: { "button.tsx": "ui/button.tsx" } },
      skinFiles: {
        "ui/button.tsx": "export function Button() { return null; }\n",
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects an override that points outside the skin UI directory", async () => {
    const fixture = await createSkinFixture();
    try {
      await fixture.writeManifest({
        ...fixture.manifest,
        uiOverrides: { "button.tsx": "views/shared/index.tsx" },
      });
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects an in-package relative import that resolves outside the package root", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "views/shared/index.tsx": [
          'import external from "../../../outside.ts";',
          "const DashboardLayout = () => external;",
          "const EmptyDashboard = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          '  "shared.empty-dashboard": EmptyDashboard,',
          "};",
        ].join("\n"),
      },
    });
    try {
      await writeFile(
        join(fixture.root, "outside.ts"),
        "export default function outside() { return null; }\n",
        "utf8"
      );
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects case-only duplicate source paths when the filesystem supports them", async ({
    skip,
  }) => {
    const fixture = await createSkinFixture();
    try {
      await fixture.writeSkinFile("assets/Icon.svg", "<svg />\n");
      await fixture.writeSkinFile("assets/icon.svg", "<svg />\n");
      const assets = await readdir(join(fixture.directory, "assets"));
      if (!assets.includes("Icon.svg") || !assets.includes("icon.svg")) {
        skip("The filesystem treats paths as case-insensitive");
      }
      await expect(fixture.refreshHashes()).rejects.toThrow(
        "Package contains paths that differ only by case"
      );
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects symbolic links when the operating system permits creating them", async ({
    skip,
  }) => {
    const fixture = await createSkinFixture();
    const outsidePath = join(fixture.root, "outside.svg");
    const linkPath = join(fixture.directory, "assets", "linked.svg");
    try {
      await writeFile(outsidePath, "<svg />\n", "utf8");
      await mkdir(join(fixture.directory, "assets"), { recursive: true });
      try {
        await symlink(outsidePath, linkPath);
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          (error.code === "EPERM" || error.code === "EACCES")
        ) {
          skip("Creating symbolic links is not permitted in this environment");
        }
        throw error;
      }
      await expect(fixture.refreshHashes()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects a missing registered view and an extra runtime view", async () => {
    const sources = [
      [
        "missing view",
        [
          "const DashboardLayout = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          "};",
        ].join("\n"),
      ],
      [
        "extra view",
        [
          "const DashboardLayout = () => null;",
          "const EmptyDashboard = () => null;",
          "const ExtraView = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          '  "shared.empty-dashboard": EmptyDashboard,',
          '  "shared.extra": ExtraView,',
          "};",
        ].join("\n"),
      ],
    ] as const;

    for (const [, source] of sources) {
      const fixture = await createSkinFixture({
        skinFiles: { "views/shared/index.tsx": source },
      });
      try {
        await fixture.refreshHashes();
        await expect(fixture.validate()).rejects.toThrow();
      } finally {
        await fixture.dispose();
      }
    }
  });

  it.each([
    [
      "duplicate keys",
      [
        "const First = () => null;",
        "const Second = () => null;",
        "const EmptyDashboard = () => null;",
        "export const views = {",
        '  "shared.dashboard-layout": First,',
        '  "shared.dashboard-layout": Second,',
        '  "shared.empty-dashboard": EmptyDashboard,',
        "};",
      ].join("\n"),
    ],
    [
      "object spread",
      [
        "const DashboardLayout = () => null;",
        "const EmptyDashboard = () => null;",
        "const inheritedViews = {};",
        "export const views = {",
        "  ...inheritedViews,",
        '  "shared.dashboard-layout": DashboardLayout,',
        '  "shared.empty-dashboard": EmptyDashboard,',
        "};",
      ].join("\n"),
    ],
    [
      "computed keys",
      [
        'const layoutId = "shared.dashboard-layout";',
        "const DashboardLayout = () => null;",
        "const EmptyDashboard = () => null;",
        "export const views = {",
        "  [layoutId]: DashboardLayout,",
        '  "shared.empty-dashboard": EmptyDashboard,',
        "};",
      ].join("\n"),
    ],
    [
      "runtime values",
      [
        "const DashboardLayout = () => null;",
        "const EmptyDashboard = () => null;",
        "function selectLayout() { return DashboardLayout; }",
        "export const views = {",
        '  "shared.dashboard-layout": selectLayout(),',
        '  "shared.empty-dashboard": EmptyDashboard,',
        "};",
      ].join("\n"),
    ],
  ])("rejects a views object with %s", async (_label, source) => {
    const fixture = await createSkinFixture({
      skinFiles: { "views/shared/index.tsx": source },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("accepts explicit identifier entries wrapped with assertions and satisfies", async () => {
    const source = [
      "const DashboardLayout = () => null;",
      "const EmptyDashboard = () => null;",
      "export const views = ({",
      '  "shared.dashboard-layout": DashboardLayout,',
      '  "shared.empty-dashboard": EmptyDashboard,',
      "} as const) satisfies Record<string, () => null>;",
    ].join("\n");
    const fixture = await createSkinFixture({
      skinFiles: { "views/shared/index.tsx": source },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it("accepts static property references in explicit view entries", async () => {
    const source = [
      "const components = {",
      "  DashboardLayout: () => null,",
      "  EmptyDashboard: () => null,",
      "};",
      "export const views = {",
      '  "shared.dashboard-layout": components.DashboardLayout,',
      '  "shared.empty-dashboard": components.EmptyDashboard,',
      "};",
    ].join("\n");
    const fixture = await createSkinFixture({
      skinFiles: { "views/shared/index.tsx": source },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });
});
