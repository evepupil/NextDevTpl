import { describe, expect, it } from "vitest";

import { createSkinFixture } from "./skin-fixture";

describe("skin source reference boundaries", () => {
  it.each([
    [
      "value import from an action entry",
      'import { action } from "@/features/shared/actions";',
    ],
    [
      "type import from a server entry",
      'import type { Data } from "@/features/shared/server";',
    ],
    [
      "re-export from a server entry",
      'export { readData } from "@/features/shared/server";',
    ],
    ["dynamic import of a database entry", 'const db = import("@/db");'],
    ["static require of an adapter", 'const adapter = require("@/adapters");'],
    ["aliased require", 'const load = require; const db = load("@/db");'],
    ["module require", 'const db = module.require("@/db");'],
    ["Node built-in", 'import fs from "node:fs";'],
    ["Node built-in subpath", 'import { readFile } from "node:fs/promises";'],
    ["legacy Node built-in subpath", 'import path from "fs/promises";'],
    ["TypeScript import-equals", 'import db = require("@/db");'],
    [
      "application alias traversal to a real database entry",
      'import db from "@/features/shared/view/../../../db";',
    ],
    [
      "relative traversal outside the skin",
      'import external from "../../../outside.ts";',
    ],
    [
      "non-static dynamic import",
      "const moduleName = '@/db'; import(moduleName);",
    ],
  ])("rejects %s", async (_label, statement) => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "views/shared/index.tsx": [
          statement,
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
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("accepts allowed type imports, re-exports, local references, and static dynamic imports", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "views/shared/parts.ts": "export const helper = () => null;\n",
        "views/shared/index.tsx": [
          'import type { SharedViewProps } from "@/features/shared/view";',
          'import type { SkinViewProps } from "@/core/skin";',
          'import { Button } from "@/components/ui/button";',
          'export { helper } from "./parts";',
          'const localPart = import("./parts");',
          "const DashboardLayout = (_props: SharedViewProps & SkinViewProps) => Button && null;",
          "const EmptyDashboard = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          '  "shared.empty-dashboard": EmptyDashboard,',
          "};",
        ].join("\n"),
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it("rejects an undeclared UI dependency", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "views/shared/index.tsx": [
          'import { helper } from "not-installed";',
          "const DashboardLayout = () => helper;",
          "const EmptyDashboard = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          '  "shared.empty-dashboard": EmptyDashboard,',
          "};",
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

  it("accepts an additional UI dependency when its exact version is declared", async () => {
    const fixture = await createSkinFixture({
      manifest: { dependencies: { "test-ui-icons": "1.2.3" } },
      skinFiles: {
        "views/shared/index.tsx": [
          'import { Icon } from "test-ui-icons";',
          "const DashboardLayout = () => Icon;",
          "const EmptyDashboard = () => null;",
          "export const views = {",
          '  "shared.dashboard-layout": DashboardLayout,',
          '  "shared.empty-dashboard": EmptyDashboard,',
          "};",
        ].join("\n"),
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).resolves.toBeDefined();
    } finally {
      await fixture.dispose();
    }
  });

  it.each([
    ["remote CSS import", '@import "https://assets.example.test/theme.css";'],
    ["Tailwind configuration loading", '@config "./config.ts";'],
    ["Tailwind plugin loading", '@plugin "untrusted-plugin";'],
    ["mixed-case Tailwind plugin loading", '@PlUgIn "untrusted-plugin";'],
    [
      "protocol-relative CSS import",
      '@import "//assets.example.test/theme.css";',
    ],
    [
      "remote URL nested in image-set",
      'body { background-image: image-set(url("https://assets.example.test/a.png") 1x); }',
    ],
    [
      "remote string image in image-set",
      'body { background-image: image-set("https://assets.example.test/a.png" 1x); }',
    ],
    [
      "remote string image in prefixed image-set",
      'body { background-image: -webkit-image-set("https://assets.example.test/a.png" 1x); }',
    ],
    [
      "escaped CSS import name",
      '@i\\6dport "https://assets.example.test/theme.css";',
    ],
    [
      "escaped CSS URL function name",
      'body { background-image: u\\72l("https://assets.example.test/a.png"); }',
    ],
    [
      "package traversal nested in url",
      'body { background-image: image-set(url("../../../outside.png") 1x); }',
    ],
    [
      "unregistered local asset",
      'body { background-image: image-set(url("./unlisted.png") 1x); }',
    ],
    [
      "remote URL with CSS escape",
      'body { background-image: url("https\\3a //assets.example.test/a.png"); }',
    ],
    [
      "percent-encoded traversal",
      'body { background-image: url("%2e%2e/%2e%2e/outside.png"); }',
    ],
  ])("rejects %s", async (_label, css) => {
    const fixture = await createSkinFixture({
      skinFiles: { "tokens.css": css },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });

  it("follows local CSS imports and accepts local nested asset URLs", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "tokens.css": [
          '@import "./layouts/brand.css";',
          'body { background-image: image-set(url("./assets/texture.png") 1x); }',
          '.image { background-image: image-set("./assets/texture.png" 1x); }',
          '.legacy-image { background-image: -webkit-image-set("./assets/texture.png" 1x); }',
        ].join("\n"),
        "layouts/brand.css": ":root { --skin-brand: #123456; }\n",
        "assets/texture.png": new Uint8Array([1, 2, 3]),
      },
      manifest: {
        assets: [
          {
            id: "texture",
            kind: "file",
            author: "Example",
            source: "https://example.test/texture.png",
            license: "CC0-1.0",
            purpose: "visual",
            files: ["assets/texture.png"],
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

  it("allows explicitly declared inline data assets in CSS", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "tokens.css":
          'body { background-image: url("data:image/svg+xml,%3Csvg%3E%3C/svg%3E"); }\n',
      },
      manifest: {
        assets: [
          {
            id: "inline-icon",
            kind: "inline",
            author: "Generated fixture",
            source: "Created for the validation test",
            license: "CC0-1.0",
            purpose: "visual",
            files: ["tokens.css"],
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

  it("rejects a missing local CSS import target", async () => {
    const fixture = await createSkinFixture({
      skinFiles: {
        "tokens.css": '@import "./theme/missing.css";\n',
      },
    });
    try {
      await fixture.refreshHashes();
      await expect(fixture.validate()).rejects.toThrow();
    } finally {
      await fixture.dispose();
    }
  });
});
