import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import type { SkinFontVariables } from "@/core/skin";

import { skinConfig } from "./config";

const fontSources = {
  "geist-sans": {
    className: GeistSans.variable,
    variable: "var(--font-geist-sans)",
  },
  "geist-mono": {
    className: GeistMono.variable,
    variable: "var(--font-geist-mono)",
  },
} as const;

function getFontSource(id: string) {
  const source = fontSources[id as keyof typeof fontSources];
  if (!source) throw new Error(`Unsupported skin font: ${id}`);
  return source;
}

const selectedFontSources = [
  getFontSource(skinConfig.fonts.body),
  getFontSource(skinConfig.fonts.heading),
  getFontSource(skinConfig.fonts.mono),
];

export const fontClassName = Array.from(
  new Set(selectedFontSources.map((font) => font.className))
).join(" ");

export const fontVariables: SkinFontVariables = {
  "--font-skin-sans": getFontSource(skinConfig.fonts.body).variable,
  "--font-skin-heading": getFontSource(skinConfig.fonts.heading).variable,
  "--font-skin-mono": getFontSource(skinConfig.fonts.mono).variable,
};
