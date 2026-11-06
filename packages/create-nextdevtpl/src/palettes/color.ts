import Color from "colorjs.io";

const BARE_HSL =
  /^(\d+(?:\.\d*)?|\.\d+) +(\d+(?:\.\d*)?|\.\d+)% +(\d+(?:\.\d*)?|\.\d+)%$/u;
const RGB_FUNCTION = /^rgb\(/u;
const DECIMAL_PLACES = 6;

export interface HslChannels {
  hue: number;
  saturation: number;
  lightness: number;
}

function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("颜色库返回了非有限 sRGB 通道。");
  }
  const rounded = Number(value.toFixed(DECIMAL_PLACES));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function formatAlpha(alpha: number): string {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new Error("颜色透明度必须是 0 到 1 之间的有限数值。");
  }
  return formatDecimal(alpha);
}

export function parseBareHsl(value: unknown, context: string): HslChannels {
  if (typeof value !== "string") {
    throw new Error(`StyleKit 主题 ${context} 的颜色值必须是裸 HSL 字符串。`);
  }
  const match = BARE_HSL.exec(value);
  if (!match) {
    throw new Error(`StyleKit 主题 ${context} 的颜色格式无效。`);
  }

  const hue = Number(match[1]);
  const saturation = Number(match[2]);
  const lightness = Number(match[3]);
  if (
    !Number.isFinite(hue) ||
    hue < 0 ||
    hue > 360 ||
    !Number.isFinite(saturation) ||
    saturation < 0 ||
    saturation > 100 ||
    !Number.isFinite(lightness) ||
    lightness < 0 ||
    lightness > 100
  ) {
    throw new Error(`StyleKit 主题 ${context} 的 HSL 数值超出允许范围。`);
  }
  return { hue, lightness, saturation };
}

export function colorFromBareHsl(value: unknown, context: string): Color {
  const { hue, lightness, saturation } = parseBareHsl(value, context);
  return new Color("hsl", [hue, saturation, lightness]);
}

export function colorFromCss(value: string, context: string): Color {
  try {
    return new Color(value);
  } catch {
    throw new Error(`默认皮肤颜色 ${context} 无法解析。`);
  }
}

export function colorToRgbCss(color: Color, alpha?: number): string {
  const converted = color.clone().toGamut("srgb").to("srgb");
  const [red, green, blue] = converted.coords;
  if (
    red === undefined ||
    red === null ||
    green === undefined ||
    green === null ||
    blue === undefined ||
    blue === null ||
    !Number.isFinite(red) ||
    !Number.isFinite(green) ||
    !Number.isFinite(blue)
  ) {
    throw new Error("颜色库没有返回有效的 sRGB 颜色。");
  }

  const channels = [red, green, blue]
    .map((channel) => formatDecimal(channel * 255))
    .join(" ");
  const outputAlpha = alpha ?? converted.alpha;
  return outputAlpha < 1
    ? `rgb(${channels} / ${formatAlpha(outputAlpha)})`
    : `rgb(${channels})`;
}

export function normalizeCssColor(value: string, context: string): string {
  return colorToRgbCss(colorFromCss(value, context));
}

export function isNormalizedRgbCss(value: unknown): value is string {
  if (typeof value !== "string" || !RGB_FUNCTION.test(value)) return false;
  try {
    return colorToRgbCss(new Color(value)) === value;
  } catch {
    return false;
  }
}

/** 使用 Color.js 在 CSS sRGB 空间按 source-over 规则合成透明色。 */
export function compositeOver(source: Color, backdrop: Color): Color {
  const sourceAlpha = source.alpha;
  const backdropAlpha = backdrop.alpha;
  const resultAlpha = sourceAlpha + backdropAlpha * (1 - sourceAlpha);
  if (resultAlpha === 0) return new Color("srgb", [0, 0, 0], 0);

  const backdropShare = (backdropAlpha * (1 - sourceAlpha)) / resultAlpha;
  const sourceOpaque = source.to("srgb");
  const backdropOpaque = backdrop.to("srgb");
  sourceOpaque.alpha = 1;
  backdropOpaque.alpha = 1;

  const result = Color.mix(sourceOpaque, backdropOpaque, backdropShare, {
    outputSpace: "srgb",
    space: "srgb",
  });
  result.alpha = resultAlpha;
  return result;
}
