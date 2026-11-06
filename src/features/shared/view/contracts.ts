import type { ComponentType, ReactNode } from "react";

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

export interface ViewContracts {
  "shared.dashboard-layout": DashboardLayoutViewProps;
  "shared.empty-dashboard": EmptyDashboardViewProps;
}
