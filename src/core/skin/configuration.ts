import type { CSSProperties } from "react";

export type SkinTheme = "system" | "light" | "dark";

export interface SkinConfiguration {
  defaultTheme: SkinTheme;
  fonts: {
    body: string;
    heading: string;
    mono: string;
  };
}

export type SkinFontVariables = CSSProperties &
  Record<
    "--font-skin-sans" | "--font-skin-heading" | "--font-skin-mono",
    string
  >;

export interface SkinVersion {
  templateVersion: string;
  viewApiVersion: number;
}
