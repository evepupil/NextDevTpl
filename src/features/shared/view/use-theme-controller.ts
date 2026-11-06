"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { SkinTheme } from "@/core/skin";

import type { ThemeController } from "./contracts";

export function useThemeController(): ThemeController {
  const { theme, setTheme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const currentTheme: SkinTheme =
    hasMounted && (theme === "light" || theme === "dark") ? theme : "system";

  return {
    theme: currentTheme,
    onThemeChange: setTheme,
  };
}
