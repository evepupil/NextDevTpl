import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import {
  inspectPaletteContrast,
  normalizeStyleKitTheme,
  parseDefaultSkinTokens,
  type Mode,
  type NormalizedPaletteTheme,
  type PaletteColorKey,
} from "../../../packages/create-nextdevtpl/src/palettes";

const RADIUS_RANGE = { min: 0, max: 2, unit: "rem" as const };
const SOURCE_HASH = "b".repeat(64);
const MODES: readonly Mode[] = ["light", "dark"];
const COLOR_KEYS: readonly PaletteColorKey[] = [
  "accent",
  "accent-foreground",
  "background",
  "border",
  "card",
  "card-foreground",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "destructive",
  "foreground",
  "input",
  "muted",
  "muted-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "ring",
  "secondary",
  "secondary-foreground",
  "sidebar",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-ring",
  "success",
  "warning",
  "grid-line",
  "glow-1",
  "glow-2",
];

let basePalette: NormalizedPaletteTheme;

beforeAll(async () => {
  const css = await readFile(
    new URL("../../../src/skin/tokens.css", import.meta.url),
    "utf8"
  );
  const defaults = parseDefaultSkinTokens(css, RADIUS_RANGE);
  basePalette = normalizeStyleKitTheme(
    "contrast-fixture",
    {
      name: "contrast-fixture",
      type: "registry:theme",
      cssVars: {
        light: { background: "0 0% 50%", foreground: "0 0% 50%" },
        dark: { background: "0 0% 50%", foreground: "0 0% 50%" },
      },
    },
    defaults,
    SOURCE_HASH
  ).palette;
});

function setColors(
  palette: NormalizedPaletteTheme,
  mode: Mode,
  values: Partial<Record<PaletteColorKey, string>>
): NormalizedPaletteTheme {
  return {
    ...palette,
    [mode]: {
      ...palette[mode],
      colors: { ...palette[mode].colors, ...values },
    },
  };
}

function flattenColors(color: string): Record<PaletteColorKey, string> {
  return Object.fromEntries(COLOR_KEYS.map((key) => [key, color])) as Record<
    PaletteColorKey,
    string
  >;
}

function measurement(
  palette: NormalizedPaletteTheme,
  mode: Mode,
  foreground: PaletteColorKey,
  background: PaletteColorKey
) {
  return inspectPaletteContrast(palette).measurements.find(
    (entry) =>
      entry.mode === mode &&
      entry.foreground === foreground &&
      entry.background === background
  );
}

describe("palette contrast inspection", () => {
  it("checks all five text/surface pairs in both themes", () => {
    const palette: NormalizedPaletteTheme = {
      ...basePalette,
      light: {
        ...basePalette.light,
        colors: flattenColors("rgb(128 128 128)"),
      },
      dark: {
        ...basePalette.dark,
        colors: flattenColors("rgb(128 128 128)"),
      },
    };

    const result = inspectPaletteContrast(palette);
    const expectedPairs = [
      ["foreground", "background"],
      ["primary-foreground", "primary"],
      ["muted-foreground", "background"],
      ["card-foreground", "card"],
      ["sidebar-foreground", "sidebar"],
    ] as const;

    expect(result.measurements).toHaveLength(10);
    expect(result.warnings).toHaveLength(10);
    for (const mode of MODES) {
      for (const [foreground, background] of expectedPairs) {
        const warning = result.warnings.find(
          (entry) =>
            entry.kind === "contrast" &&
            entry.mode === mode &&
            entry.foreground === foreground &&
            entry.background === background
        );
        expect(warning?.kind).toBe("contrast");
        if (warning?.kind === "contrast") {
          expect(warning.ratio).toBeCloseTo(1, 6);
        }
      }
    }
  });

  it("composites translucent primary, card, and sidebar surfaces over the dark page", () => {
    const primaryAlpha = "rgb(255 255 255 / 0.5)";
    const cardAlpha = "rgb(255 255 255 / 0.5)";
    const sidebarAlpha = "rgb(255 255 255 / 0.5)";
    let palette: NormalizedPaletteTheme = {
      ...basePalette,
      light: {
        ...basePalette.light,
        colors: {
          ...flattenColors("rgb(255 255 255)"),
          background: "rgb(255 255 255)",
          foreground: "rgb(0 0 0)",
          primary: "rgb(0 0 0)",
          "primary-foreground": "rgb(255 255 255)",
          muted: "rgb(255 255 255)",
          "muted-foreground": "rgb(0 0 0)",
          card: "rgb(255 255 255)",
          "card-foreground": "rgb(0 0 0)",
          sidebar: "rgb(255 255 255)",
          "sidebar-foreground": "rgb(0 0 0)",
        },
      },
      dark: {
        ...basePalette.dark,
        colors: {
          ...flattenColors("rgb(0 0 0)"),
          background: "rgb(0 0 0)",
          foreground: "rgb(255 255 255)",
          primary: primaryAlpha,
          "primary-foreground": "rgb(255 255 255)",
          muted: "rgb(0 0 0)",
          "muted-foreground": "rgb(255 255 255)",
          card: cardAlpha,
          "card-foreground": "rgb(0 0 0)",
          sidebar: sidebarAlpha,
          "sidebar-foreground": "rgb(255 255 255)",
        },
      },
    };

    let result = inspectPaletteContrast(palette);
    expect(
      measurement(palette, "dark", "primary-foreground", "primary")?.ratio
    ).toBeCloseTo(3.98, 2);
    expect(
      measurement(palette, "dark", "card-foreground", "card")?.ratio
    ).toBeCloseTo(5.28, 2);
    expect(
      measurement(palette, "dark", "sidebar-foreground", "sidebar")?.ratio
    ).toBeCloseTo(3.98, 2);
    expect(
      result.warnings.some(
        (entry) =>
          entry.kind === "contrast" &&
          entry.mode === "dark" &&
          entry.foreground === "primary-foreground" &&
          entry.background === "primary"
      )
    ).toBe(true);

    palette = setColors(palette, "dark", {
      "primary-foreground": "rgb(0 0 0)",
      "sidebar-foreground": "rgb(0 0 0)",
    });
    result = inspectPaletteContrast(palette);
    expect(
      measurement(palette, "dark", "primary-foreground", "primary")?.ratio
    ).toBeCloseTo(5.28, 2);
    expect(
      result.warnings.some(
        (entry) =>
          entry.kind === "contrast" &&
          entry.mode === "dark" &&
          entry.foreground === "primary-foreground" &&
          entry.background === "primary"
      )
    ).toBe(false);
  });

  it("composites a translucent page background over the mode base color", () => {
    const palette = setColors(basePalette, "dark", {
      background: "rgb(255 255 255 / 0.5)",
      foreground: "rgb(0 0 0)",
      primary: "rgb(0 0 0)",
      "primary-foreground": "rgb(255 255 255)",
      muted: "rgb(0 0 0)",
      "muted-foreground": "rgb(255 255 255)",
      card: "rgb(0 0 0)",
      "card-foreground": "rgb(255 255 255)",
      sidebar: "rgb(0 0 0)",
      "sidebar-foreground": "rgb(255 255 255)",
    });

    expect(
      measurement(palette, "dark", "foreground", "background")?.ratio
    ).toBeCloseTo(5.28, 2);
  });
});
