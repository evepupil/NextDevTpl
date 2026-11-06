import postcss, { type Declaration, type Rule } from "postcss";

import { isNormalizedRgbCss } from "./color.js";
import { parseRadiusRem } from "./normalize.js";
import type { NormalizedPaletteMode, NormalizedPaletteTheme } from "./types.js";
import { PALETTE_COLOR_KEYS, STYLEKIT_SLUG_PATTERN } from "./types.js";

const NORMALIZED_RADIUS = /^(?:0|(?:\d+(?:\.\d+)?|\.\d+)rem)$/u;

function requiredRule(root: postcss.Root, selector: string): Rule {
  const matches: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.selector === selector) matches.push(rule);
  });
  if (matches.length !== 1) {
    throw new Error(`tokens.css 必须有且仅有一个 ${selector} 区块。`);
  }
  const rule = matches[0];
  if (!rule) throw new Error(`tokens.css 缺少 ${selector} 区块。`);
  return rule;
}

function requiredDeclaration(rule: Rule, property: string): Declaration {
  const matches = rule.nodes?.filter(
    (node): node is Declaration =>
      node.type === "decl" && node.prop === property
  );
  if (matches?.length !== 1 || !matches[0]) {
    throw new Error(
      `tokens.css 中 ${rule.selector} 缺少唯一的 ${property} 声明。`
    );
  }
  return matches[0];
}

function validatePaletteMode(
  id: string,
  mode: "light" | "dark",
  value: NormalizedPaletteMode
): void {
  if (!NORMALIZED_RADIUS.test(value.radius)) {
    throw new Error(`皮肤 ${id}/${mode} 的规范化圆角格式无效。`);
  }
  const radius = parseRadiusRem(value.radius, `${id}/${mode}`);
  if (radius > 2) {
    throw new Error(`皮肤 ${id}/${mode} 的规范化圆角超出默认范围。`);
  }
  if (value.radiusInfo.effectiveRem !== radius) {
    throw new Error(`皮肤 ${id}/${mode} 的圆角元数据与 CSS 值不一致。`);
  }
  for (const key of PALETTE_COLOR_KEYS) {
    if (!isNormalizedRgbCss(value.colors[key])) {
      throw new Error(`皮肤 ${id}/${mode} 的 --${key} 不是规范化 sRGB 颜色。`);
    }
  }
}

function setMode(
  rule: Rule,
  mode: NormalizedPaletteMode,
  writeRadius: boolean
): void {
  for (const key of PALETTE_COLOR_KEYS) {
    requiredDeclaration(rule, `--${key}`).value = mode.colors[key];
  }
  if (writeRadius) requiredDeclaration(rule, "--radius").value = mode.radius;
}

/** 未选择配色时直接返回原字符串，避免解析和序列化改变字节。 */
export function applyPaletteToTokensCss(
  css: string,
  palette?: NormalizedPaletteTheme
): { changed: boolean; css: string } {
  if (!palette) return { changed: false, css };
  if (!STYLEKIT_SLUG_PATTERN.test(palette.id)) {
    throw new Error("配色编号格式无效。");
  }
  if (
    palette.schemaVersion !== 1 ||
    palette.rulesVersion !== 1 ||
    !/^[a-f0-9]{64}$/u.test(palette.sourceSha256)
  ) {
    throw new Error("配色版本或来源摘要无效。");
  }
  validatePaletteMode(palette.id, "light", palette.light);
  validatePaletteMode(palette.id, "dark", palette.dark);

  const root = postcss.parse(css);
  const lightRule = requiredRule(root, ":root");
  const darkRule = requiredRule(root, ".dark");
  if (
    parseRadiusRem(palette.light.radius, `${palette.id}/light`) !==
    parseRadiusRem(palette.dark.radius, `${palette.id}/dark`)
  ) {
    throw new Error("明暗主题的圆角不同，无法写入全局 --radius 变量。");
  }
  setMode(lightRule, palette.light, true);
  setMode(darkRule, palette.dark, false);
  return { changed: true, css: root.toString() };
}
