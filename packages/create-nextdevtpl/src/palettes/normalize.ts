import postcss from "postcss";

import {
  colorFromBareHsl,
  colorFromCss,
  colorToRgbCss,
  normalizeCssColor,
  parseBareHsl,
} from "./color.js";
import {
  COLOR_RULES_VERSION,
  DEFAULT_SKIN_COLOR_KEYS,
  type DefaultSkinTokens,
  EXTENDED_COLOR_KEYS,
  MODES,
  type Mode,
  type NormalizedPaletteResult,
  type NormalizedPaletteTheme,
  type NormalizedRadiusInfo,
  PALETTE_COLOR_KEYS,
  type PaletteColorKey,
  type PaletteInputKey,
  type RadiusRange,
  SNAPSHOT_SCHEMA_VERSION,
  STYLEKIT_SLUG_PATTERN,
  type StyleKitTheme,
} from "./types.js";

const REM_VALUE = /^(?:0|(?:\d+(?:\.\d+)?|\.\d+)rem)$/u;
const STYLEKIT_RADIUS = /^(?:0|(\d+(?:\.\d+)?|\.\d+)(rem|px))$/u;

const DERIVED_VALUES: Record<"success" | "warning", Record<Mode, string>> = {
  success: {
    dark: "oklch(0.70 0.095 165)",
    light: "oklch(0.52 0.095 165)",
  },
  warning: {
    dark: "oklch(0.78 0.13 70)",
    light: "oklch(0.74 0.13 70)",
  },
};

const DERIVED_ALPHA: Record<
  "grid-line" | "glow-1" | "glow-2",
  Record<Mode, number>
> = {
  "glow-1": { dark: 0.14, light: 0.1 },
  "glow-2": { dark: 0.08, light: 0.05 },
  "grid-line": { dark: 0.065, light: 0.045 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(6)));
}

export function parseRadiusRem(value: unknown, context: string): number {
  if (typeof value !== "string" || !REM_VALUE.test(value)) {
    throw new Error(`皮肤 ${context} 的圆角必须是 0 或非负 rem 长度。`);
  }
  const rem = value === "0" ? 0 : Number(value.slice(0, -3));
  if (!Number.isFinite(rem) || rem < 0) {
    throw new Error(`皮肤 ${context} 的圆角不是有效 rem 长度。`);
  }
  return rem;
}

export function parseStyleKitRadius(
  value: unknown,
  context: string
): {
  sourceUnit: "unitless" | "rem" | "px";
  sourceValue: number;
  remValue: number;
} {
  if (value === "0") {
    return { remValue: 0, sourceUnit: "unitless", sourceValue: 0 };
  }
  if (typeof value !== "string") {
    throw new Error(`StyleKit 主题 ${context} 的圆角格式无效。`);
  }
  const match = STYLEKIT_RADIUS.exec(value);
  if (!match) {
    throw new Error(`StyleKit 主题 ${context} 的圆角只支持 0、rem 或 px。`);
  }
  const sourceValue = Number(match[1]);
  const sourceUnit = match[2];
  if (
    !Number.isFinite(sourceValue) ||
    sourceValue < 0 ||
    (sourceUnit !== "rem" && sourceUnit !== "px")
  ) {
    throw new Error(`StyleKit 主题 ${context} 的圆角数值无效。`);
  }
  return {
    remValue: sourceUnit === "px" ? sourceValue / 16 : sourceValue,
    sourceUnit,
    sourceValue,
  };
}

export function validateRadiusRange(value: RadiusRange): RadiusRange {
  if (
    !finiteNumber(value.min) ||
    !finiteNumber(value.max) ||
    value.min < 0 ||
    value.max < value.min ||
    value.unit !== "rem"
  ) {
    throw new Error("默认皮肤的圆角范围配置无效。");
  }
  return value;
}

export function parseStyleKitTheme(
  value: unknown,
  expectedSlug: string
): StyleKitTheme {
  if (!STYLEKIT_SLUG_PATTERN.test(expectedSlug)) {
    throw new Error("StyleKit 主题编号格式无效。");
  }
  if (!isRecord(value) || value.name !== expectedSlug) {
    throw new Error(`StyleKit 主题 ${expectedSlug} 的名称与索引不一致。`);
  }
  if (value.type !== "registry:theme" || !isRecord(value.cssVars)) {
    throw new Error(`StyleKit 主题 ${expectedSlug} 的结构无效。`);
  }

  const cssVars: Record<Mode, Record<string, unknown>> = {
    dark: {} as Record<string, unknown>,
    light: {} as Record<string, unknown>,
  };
  for (const mode of MODES) {
    const vars = value.cssVars[mode];
    if (!isRecord(vars)) {
      throw new Error(`StyleKit 主题 ${expectedSlug} 缺少 ${mode} 颜色对象。`);
    }
    for (const [key, raw] of Object.entries(vars)) {
      if (key === "radius") {
        parseStyleKitRadius(raw, `${expectedSlug}/${mode}`);
        continue;
      }
      if ((PALETTE_COLOR_KEYS as readonly string[]).includes(key)) {
        parseBareHsl(raw, `${expectedSlug}/${mode}/${key}`);
      }
    }
    cssVars[mode] = vars;
  }

  return { cssVars, name: expectedSlug, type: "registry:theme" };
}

function defaultModeTokens(
  declarations: Record<Mode, Map<string, string>>,
  mode: Mode,
  fallback: Record<string, string>,
  radiusRange: RadiusRange
): { colors: Record<PaletteColorKey, string>; radius: string } {
  const colors = {} as Record<PaletteColorKey, string>;
  for (const key of PALETTE_COLOR_KEYS) {
    const value = declarations[mode].get(key) ?? fallback[key];
    if (!value) throw new Error(`默认皮肤缺少 --${key} 变量。`);
    colors[key] = normalizeCssColor(value, `${mode}/--${key}`);
  }
  const radius = declarations[mode].get("radius") ?? fallback.radius;
  if (!radius) throw new Error(`默认皮肤缺少 ${mode} --radius 变量。`);
  const radiusRem = parseRadiusRem(radius, `${mode}/--radius`);
  if (radiusRem < radiusRange.min || radiusRem > radiusRange.max) {
    throw new Error(`默认皮肤 ${mode} 圆角超出自定义范围。`);
  }
  return { colors, radius };
}

export function parseDefaultSkinTokens(
  css: string,
  radiusRange: RadiusRange
): DefaultSkinTokens {
  validateRadiusRange(radiusRange);
  const root = postcss.parse(css);
  const declarations: Record<Mode, Map<string, string>> = {
    dark: new Map(),
    light: new Map(),
  };
  const expectedSelectors: Record<string, Mode> = {
    ".dark": "dark",
    ":root": "light",
  };
  const selectorCounts: Record<Mode, number> = { dark: 0, light: 0 };

  root.walkRules((rule) => {
    const mode = expectedSelectors[rule.selector];
    if (!mode) return;
    selectorCounts[mode]++;
    rule.walkDecls((declaration) => {
      if (!declaration.prop.startsWith("--")) return;
      const key = declaration.prop.slice(2);
      if (
        key !== "radius" &&
        !(PALETTE_COLOR_KEYS as readonly string[]).includes(key)
      ) {
        return;
      }
      if (declarations[mode].has(key)) {
        throw new Error(`默认皮肤 ${mode} 中 --${key} 重复声明。`);
      }
      declarations[mode].set(key, declaration.value);
    });
  });

  if (selectorCounts.light !== 1 || selectorCounts.dark !== 1) {
    throw new Error("默认皮肤必须各有一个 :root 和 .dark 变量区块。");
  }
  const light = defaultModeTokens(declarations, "light", {}, radiusRange);
  const dark = defaultModeTokens(
    declarations,
    "dark",
    {
      ...Object.fromEntries(declarations.light),
    },
    radiusRange
  );
  return {
    colors: { dark: dark.colors, light: light.colors },
    radius: { dark: dark.radius, light: light.radius },
    radiusRange,
  };
}

function checkedColor(
  vars: Record<string, unknown>,
  key: PaletteColorKey,
  slug: string,
  mode: Mode
): string | undefined {
  if (!(key in vars)) return undefined;
  return colorToRgbCss(colorFromBareHsl(vars[key], `${slug}/${mode}/${key}`));
}

function normalizedMode(
  slug: string,
  mode: Mode,
  vars: Record<string, unknown>,
  defaults: DefaultSkinTokens
): {
  colors: Record<PaletteColorKey, string>;
  missingKeys: PaletteInputKey[];
  radius: string;
  radiusInfo: NormalizedRadiusInfo;
  radiusWarning: NormalizedPaletteResult["warnings"][number] | undefined;
} {
  const colors = {} as Record<PaletteColorKey, string>;
  const missingKeys: PaletteInputKey[] = [];
  for (const key of DEFAULT_SKIN_COLOR_KEYS) {
    const color = checkedColor(vars, key, slug, mode);
    if (color) {
      colors[key] = color;
    } else {
      colors[key] = defaults.colors[mode][key];
      missingKeys.push(key);
    }
  }

  for (const key of EXTENDED_COLOR_KEYS) {
    const color = checkedColor(vars, key, slug, mode);
    if (color) {
      colors[key] = color;
      continue;
    }
    missingKeys.push(key);
    if (key === "success" || key === "warning") {
      colors[key] = normalizeCssColor(
        DERIVED_VALUES[key][mode],
        `${slug}/${mode}/${key}`
      );
    } else {
      const sourceKey =
        key === "grid-line"
          ? "foreground"
          : key === "glow-1"
            ? "primary"
            : "chart-5";
      const sourceColor = colorFromCss(
        colors[sourceKey],
        `${slug}/${mode}/${sourceKey}`
      );
      colors[key] = colorToRgbCss(sourceColor, DERIVED_ALPHA[key][mode]);
    }
  }

  let radius = defaults.radius[mode];
  const defaultRadiusRem = parseRadiusRem(radius, `${slug}/${mode}/default`);
  let radiusInfo: NormalizedRadiusInfo = {
    clamped: false,
    convertedRem: defaultRadiusRem,
    effectiveRem: defaultRadiusRem,
    sourceUnit: "default",
    sourceValue: null,
  };
  let radiusWarning: NormalizedPaletteResult["warnings"][number] | undefined;
  if ("radius" in vars) {
    const parsed = parseStyleKitRadius(vars.radius, `${slug}/${mode}`);
    const effectiveValue = Math.min(
      defaults.radiusRange.max,
      Math.max(defaults.radiusRange.min, parsed.remValue)
    );
    radius = effectiveValue === 0 ? "0" : `${formatNumber(effectiveValue)}rem`;
    radiusInfo = {
      clamped: effectiveValue !== parsed.remValue,
      convertedRem: parsed.remValue,
      effectiveRem: effectiveValue,
      sourceUnit: parsed.sourceUnit,
      sourceValue: parsed.sourceValue,
    };
    if (effectiveValue !== parsed.remValue) {
      radiusWarning = {
        convertedRem: parsed.remValue,
        effectiveRem: effectiveValue,
        id: slug,
        kind: "radius-clamped",
        mode,
        sourceUnit: parsed.sourceUnit,
        sourceValue: parsed.sourceValue,
      };
    }
  } else {
    missingKeys.push("radius");
  }

  return { colors, missingKeys, radius, radiusInfo, radiusWarning };
}

export function normalizeStyleKitTheme(
  slug: string,
  rawTheme: unknown,
  defaults: DefaultSkinTokens,
  sourceSha256: string
): NormalizedPaletteResult {
  if (!/^[a-f0-9]{64}$/u.test(sourceSha256)) {
    throw new Error("StyleKit 主题原文摘要无效。");
  }
  const theme = parseStyleKitTheme(rawTheme, slug);
  const light = normalizedMode(slug, "light", theme.cssVars.light, defaults);
  const dark = normalizedMode(slug, "dark", theme.cssVars.dark, defaults);
  if (light.radiusInfo.convertedRem !== dark.radiusInfo.convertedRem) {
    throw new Error(
      `StyleKit 主题 ${slug} 的明暗圆角不同，无法套用到全局圆角变量。`
    );
  }
  if (
    parseRadiusRem(light.radius, `${slug}/light`) !==
    parseRadiusRem(dark.radius, `${slug}/dark`)
  ) {
    throw new Error(
      `StyleKit 主题 ${slug} 的明暗圆角不同，无法套用到全局圆角变量。`
    );
  }
  const ignoredKeys = [
    ...new Set(
      MODES.flatMap((mode) =>
        Object.keys(theme.cssVars[mode]).filter(
          (key) =>
            key !== "radius" &&
            !(PALETTE_COLOR_KEYS as readonly string[]).includes(key)
        )
      )
    ),
  ].sort();
  const palette: NormalizedPaletteTheme = {
    dark: {
      colors: dark.colors,
      radius: dark.radius,
      radiusInfo: dark.radiusInfo,
    },
    id: slug,
    ignoredKeys,
    light: {
      colors: light.colors,
      radius: light.radius,
      radiusInfo: light.radiusInfo,
    },
    missingKeys: { dark: dark.missingKeys, light: light.missingKeys },
    rulesVersion: COLOR_RULES_VERSION,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    sourceSha256,
  };
  const warnings = [light.radiusWarning, dark.radiusWarning].filter(
    (warning): warning is NonNullable<typeof warning> => warning !== undefined
  );
  return { palette, warnings };
}
