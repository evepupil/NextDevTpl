"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui-utils";
import { useThemeController } from "@/features/shared/view";

export interface ModeToggleProps {
  variant?: "dropdown" | "inline";
  className?: string;
}

export function ModeToggle({
  variant = "dropdown",
  className,
}: ModeToggleProps) {
  const { theme, onThemeChange } = useThemeController();
  const t = useTranslations("Theme");

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          type="button"
          onClick={() => onThemeChange("light")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            theme === "light"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("lightMode")}
        >
          <Sun className="h-4 w-4" />
          <span className="sr-only">{t("lightMode")}</span>
        </button>
        <button
          type="button"
          onClick={() => onThemeChange("dark")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            theme === "dark"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("darkMode")}
        >
          <Moon className="h-4 w-4" />
          <span className="sr-only">{t("darkMode")}</span>
        </button>
        <button
          type="button"
          onClick={() => onThemeChange("system")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            theme === "system"
              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("followSystem")}
        >
          <Monitor className="h-4 w-4" />
          <span className="sr-only">{t("followSystem")}</span>
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("lightMode")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("darkMode")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {t("followSystem")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
