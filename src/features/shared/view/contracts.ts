import type { ComponentType, ReactNode } from "react";
import type { SkinTheme } from "@/core/skin";
import type { CookiePreferences } from "@/lib/cookie-consent";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface WorkspaceNavigationItem {
  title: string;
  href: string;
  translationKey?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

export interface WorkspaceNavigationGroup {
  title: string;
  translationKey?: string;
  items: readonly WorkspaceNavigationItem[];
}

export type WorkspaceMode = "public" | "protected" | "workspace";
export type WorkspacePlan = "free" | "starter" | "pro" | "ultra";

export interface WorkspaceCreditsState {
  balance: number;
  isPending: boolean;
}

export interface WorkspacePlanState {
  id: WorkspacePlan;
}

export interface DashboardRuntime {
  navigation: readonly WorkspaceNavigationGroup[];
  user: WorkspaceUser | null;
  capabilities: { credits: boolean; subscription: boolean };
  actions: { onSignOut: () => Promise<void> };
}

export interface DashboardLayoutViewProps {
  children: ReactNode;
  mode: WorkspaceMode;
}

export interface EmptyDashboardViewProps {
  locale: string;
}

export type CookieCategoryId = "necessary" | "analytics" | "marketing";

export interface CookieSettingsController {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: CookiePreferences;
  expandedItems: readonly CookieCategoryId[];
  toggleExpanded: (id: CookieCategoryId) => void;
  getCategoryValue: (id: CookieCategoryId) => boolean;
  onCategoryChange: (id: CookieCategoryId, value: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSavePreferences: () => void;
}

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export interface LanguageController {
  locale: string;
  isPending: boolean;
  locales: readonly LanguageOption[];
  onLocaleChange: (locale: string) => void;
}

export interface ThemeController {
  theme: SkinTheme;
  onThemeChange: (theme: SkinTheme) => void;
}

export interface ViewContracts {
  "shared.dashboard-layout": DashboardLayoutViewProps;
  "shared.empty-dashboard": EmptyDashboardViewProps;
}
