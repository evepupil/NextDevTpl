import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import {
  normalizeStyleKitTheme,
  parseDefaultSkinTokens,
} from "../../../packages/create-nextdevtpl/src/palettes";
import type {
  DefaultSkinTokens,
  Mode,
  StyleKitTheme,
} from "../../../packages/create-nextdevtpl/src/palettes";

const RADIUS_RANGE = { min: 0, max: 2, unit: "rem" as const };
const SOURCE_HASH = "a".repeat(64);
const MODES: readonly Mode[] = ["light", "dark"];
const EXTENDED_KEYS = [
  "success",
  "warning",
  "grid-line",
  "glow-1",
  "glow-2",
] as const;
const generatorRequire = createRequire(
  new URL("../../../packages/create-nextdevtpl/package.json", import.meta.url)
);

interface ColorValue {
  coords: readonly number[];
  to(space: string): ColorValue;
  toGamut(space: string): ColorValue;
}

interface ColorConstructor {
  new (value: string): ColorValue;
}

const Color = (generatorRequire("colorjs.io") as { default: ColorConstructor })
  .default;

let defaults: DefaultSkinTokens;

beforeAll(async () => {
  const css = await readFile(
    new URL("../../../src/skin/tokens.css", import.meta.url),
    "utf8"
  );
  defaults = parseDefaultSkinTokens(css, RADIUS_RANGE);
});

function createTheme(
  overrides: Partial<Record<Mode, Record<string, unknown>>> = {}
): StyleKitTheme {
  return {
    cssVars: {
      light: {
        background: "0 0% 50%",
        foreground: "0 0% 50%",
        radius: "0.625rem",
        ...overrides.light,
      },
      dark: {
        background: "0 0% 50%",
        foreground: "0 0% 50%",
        radius: "0.625rem",
        ...overrides.dark,
      },
    },
    name: "fixture-theme",
    type: "registry:theme",
  };
}

function normalize(theme: StyleKitTheme) {
  return normalizeStyleKitTheme("fixture-theme", theme, defaults, SOURCE_HASH);
}

function expectColorEquivalent(actual: string, expected: string): void {
  const actualChannels = new Color(actual).to("srgb").coords;
  const expectedChannels = new Color(expected)
    .toGamut("srgb")
    .to("srgb").coords;
  for (let index = 0; index < 3; index += 1) {
    expect(actualChannels[index]).toBeCloseTo(
      expectedChannels[index] ?? NaN,
      5
    );
  }
}

describe("StyleKit theme normalization", () => {
  it("accepts HSL boundary values and emits complete CSS colors", () => {
    const { palette } = normalize(
      createTheme({
        light: {
          background: "360 100% 100%",
          foreground: "0 0% 0%",
          primary: "120 100% 50%",
        },
        dark: {
          background: "0 0% 0%",
          foreground: "360 100% 100%",
        },
      })
    );

    expect(palette.light.colors.background).toBe("rgb(255 255 255)");
    expect(palette.light.colors.foreground).toBe("rgb(0 0 0)");
    expect(palette.light.colors.primary).toBe("rgb(0 255 0)");
    expect(palette.dark.colors.background).toBe("rgb(0 0 0)");
    expect(palette.dark.colors.foreground).toBe("rgb(255 255 255)");
  });

  it.each([
    "-1 0% 50%",
    "361 0% 50%",
    "0 100.01% 50%",
    "0 0% -0.01%",
    "0 0% 100.01%",
    "NaN 0% 50%",
    "0 0% 50% / 0.5",
    "var(--primary)",
    "url(javascript:alert(1))",
  ])("rejects invalid or unsafe HSL input %s", (value) => {
    expect(() =>
      normalize(createTheme({ light: { primary: value } }))
    ).toThrow();
  });

  it("converts pixel radii to rem and clamps to the skin's declared range", () => {
    const converted = normalize(
      createTheme({
        light: { radius: "24px" },
        dark: { radius: "24px" },
      })
    );
    expect(converted.palette.light.radius).toBe("1.5rem");
    expect(converted.palette.dark.radius).toBe("1.5rem");
    expect(converted.palette.light.radiusInfo).toMatchObject({
      clamped: false,
      convertedRem: 1.5,
      effectiveRem: 1.5,
      sourceUnit: "px",
      sourceValue: 24,
    });

    const rem = normalize(
      createTheme({
        light: { radius: "1.25rem" },
        dark: { radius: "1.25rem" },
      })
    ).palette;
    expect(rem.light.radius).toBe("1.25rem");
    expect(rem.dark.radius).toBe("1.25rem");
    expect(rem.light.radiusInfo.sourceUnit).toBe("rem");

    const { palette, warnings } = normalize(
      createTheme({
        light: { radius: "9999px" },
        dark: { radius: "9999px" },
      })
    );

    expect(palette.light.radius).toBe("2rem");
    expect(palette.dark.radius).toBe("2rem");
    expect(palette.light.radiusInfo).toMatchObject({
      clamped: true,
      convertedRem: 624.9375,
      effectiveRem: 2,
      sourceUnit: "px",
      sourceValue: 9999,
    });
    expect(warnings).toEqual([
      expect.objectContaining({
        convertedRem: 624.9375,
        effectiveRem: 2,
        kind: "radius-clamped",
        mode: "light",
        sourceUnit: "px",
        sourceValue: 9999,
      }),
      expect.objectContaining({
        convertedRem: 624.9375,
        effectiveRem: 2,
        kind: "radius-clamped",
        mode: "dark",
        sourceUnit: "px",
        sourceValue: 9999,
      }),
    ]);
  });

  it.each([
    "-1px",
    "Infinitypx",
    "2vh",
    "calc(24px)",
    "2px extra",
  ])("rejects invalid radius input %s", (value) => {
    expect(() =>
      normalize(
        createTheme({
          light: { radius: value },
          dark: { radius: value },
        })
      )
    ).toThrow();
  });

  it("fills missing skin and extended colors from defaults and fixed derivations", () => {
    const theme = createTheme();
    for (const mode of MODES) {
      delete theme.cssVars[mode].foreground;
      delete theme.cssVars[mode].radius;
    }

    const { palette } = normalize(theme);

    for (const mode of MODES) {
      expect(palette.missingKeys[mode]).toContain("foreground");
      expect(palette.missingKeys[mode]).toContain("radius");
      for (const key of EXTENDED_KEYS) {
        expect(palette[mode].colors[key]).toMatch(/^rgb\(/u);
      }
    }
    expect(palette.light.colors.foreground).toBe(
      defaults.colors.light.foreground
    );
    expect(palette.dark.colors.foreground).toBe(
      defaults.colors.dark.foreground
    );
    expectColorEquivalent(
      palette.light.colors.success,
      "oklch(0.52 0.095 165)"
    );
    expectColorEquivalent(palette.dark.colors.success, "oklch(0.70 0.095 165)");
    expectColorEquivalent(palette.light.colors.warning, "oklch(0.74 0.13 70)");
    expectColorEquivalent(palette.dark.colors.warning, "oklch(0.78 0.13 70)");
    expect(palette.light.colors["grid-line"]).toMatch(/\/ 0\.045\)$/u);
    expect(palette.dark.colors["grid-line"]).toMatch(/\/ 0\.065\)$/u);
    expect(palette.light.colors["glow-1"]).toMatch(/\/ 0\.1\)$/u);
    expect(palette.dark.colors["glow-1"]).toMatch(/\/ 0\.14\)$/u);
    expect(palette.light.colors["glow-2"]).toMatch(/\/ 0\.05\)$/u);
    expect(palette.dark.colors["glow-2"]).toMatch(/\/ 0\.08\)$/u);
    expect(palette.missingKeys.light).toEqual(
      expect.arrayContaining(["success", "warning", "grid-line"])
    );
    expect(palette.missingKeys.dark).toEqual(
      expect.arrayContaining(["glow-1", "glow-2"])
    );
  });
});
