import Color from "colorjs.io";

import { colorFromCss, compositeOver } from "./color.js";
import type {
  ContrastMeasurement,
  ContrastResult,
  Mode,
  NormalizedPaletteTheme,
  PaletteColorKey,
  PaletteWarning,
} from "./types.js";

const CONTRAST_THRESHOLD = 4.5;

const PAIRS: readonly {
  background: PaletteColorKey;
  foreground: PaletteColorKey;
}[] = [
  { background: "background", foreground: "foreground" },
  { background: "primary", foreground: "primary-foreground" },
  { background: "background", foreground: "muted-foreground" },
  { background: "card", foreground: "card-foreground" },
  { background: "sidebar", foreground: "sidebar-foreground" },
];

function pageBackground(mode: Mode): Color {
  return new Color(mode === "light" ? "white" : "black");
}

export function inspectPaletteContrast(
  palette: NormalizedPaletteTheme
): ContrastResult {
  const measurements: ContrastMeasurement[] = [];
  const warnings: PaletteWarning[] = [];

  for (const mode of ["light", "dark"] as const) {
    const colors = palette[mode].colors;
    const pageBase = compositeOver(
      colorFromCss(colors.background, `${palette.id}/${mode}/background`),
      pageBackground(mode)
    ).to("srgb");
    for (const pair of PAIRS) {
      const surface =
        pair.background === "background"
          ? pageBase
          : compositeOver(
              colorFromCss(
                colors[pair.background],
                `${palette.id}/${mode}/${pair.background}`
              ),
              pageBase
            ).to("srgb");
      const foreground = compositeOver(
        colorFromCss(
          colors[pair.foreground],
          `${palette.id}/${mode}/${pair.foreground}`
        ),
        surface
      ).to("srgb");
      const ratio = Color.contrast(surface, foreground, "WCAG21");
      const measurement = { ...pair, mode, ratio };
      measurements.push(measurement);
      if (ratio < CONTRAST_THRESHOLD) {
        warnings.push({
          background: pair.background,
          foreground: pair.foreground,
          id: palette.id,
          kind: "contrast",
          mode,
          ratio,
        });
      }
    }
  }

  return { measurements, warnings };
}

export function formatPaletteWarning(warning: PaletteWarning): string {
  const modeName = warning.mode === "light" ? "浅色" : "深色";
  if (warning.kind === "radius-clamped") {
    const suffix = warning.sourceUnit === "unitless" ? "" : warning.sourceUnit;
    return `${warning.id} ${modeName} 圆角 ${warning.sourceValue}${suffix} 转换为 ${warning.convertedRem}rem，已限制为 ${warning.effectiveRem}rem`;
  }
  return `${warning.id} ${modeName} ${warning.foreground}/${warning.background} 对比度 ${warning.ratio.toFixed(2)}:1`;
}
