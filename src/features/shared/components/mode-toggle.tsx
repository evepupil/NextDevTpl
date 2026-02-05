"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * 主题切换组件
 *
 * 功能:
 * - 在浅色、深色、系统主题之间切换
 * - 使用 next-themes 管理主题状态
 * - 支持两种显示模式: dropdown 和 inline
 */

interface ModeToggleProps {
  /**
   * 显示模式
   * - dropdown: 下拉菜单形式 (默认)
   * - inline: 并排按钮形式
   */
  variant?: "dropdown" | "inline";
  /**
   * 自定义类名
   */
  className?: string;
}

export function ModeToggle({ variant = "dropdown", className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Common.theme");

  // 内联按钮模式
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            theme === "light"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("light")}
        >
          <Sun className="h-4 w-4" />
          <span className="sr-only">{t("light")}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            theme === "dark"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("dark")}
        >
          <Moon className="h-4 w-4" />
          <span className="sr-only">{t("dark")}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            theme === "system"
              ? "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("system")}
        >
          <Monitor className="h-4 w-4" />
          <span className="sr-only">{t("system")}</span>
        </button>
      </div>
    );
  }

  // 下拉菜单模式 (默认)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("switch")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
