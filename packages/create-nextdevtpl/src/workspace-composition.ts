import { resolve } from "node:path";

import { removePath, writeText } from "./filesystem.js";

const DASHBOARD_GROUP = [
  "dashboard",
  "credits",
  "settings",
  "support",
] as const;

function createViewDataSource(selectedModules: readonly string[]): string {
  const selected = new Set(selectedModules);
  const hasAuth = selected.has("auth");
  const hasDashboard = selected.has("dashboard");
  const hasCredits = hasDashboard && selected.has("credits");
  const hasOverview = hasDashboard && hasCredits;
  const hasSubscription = hasOverview && selected.has("subscription");
  const mode = hasAuth ? (hasDashboard ? "workspace" : "protected") : "public";
  const imports = [
    'import type { WorkspaceMode } from "@/features/shared/view";',
    hasAuth
      ? 'import { getWorkspaceSession as getAuthWorkspaceSession } from "@/features/auth/server";'
      : "",
    hasDashboard && hasCredits
      ? 'import { getDashboardCredits } from "@/features/credits/server";'
      : "",
    hasDashboard && hasSubscription
      ? 'import { getDashboardPlan } from "@/features/subscription/server";'
      : "",
    hasOverview
      ? 'import { getDashboardOverviewData } from "@/features/dashboard/server";'
      : "",
  ].filter(Boolean);
  const providerEntries = [
    hasCredits ? "  loadCredits: getDashboardCredits," : "",
    hasSubscription ? "  loadPlan: getDashboardPlan," : "",
  ].filter(Boolean);
  const dashboardData = hasOverview
    ? `const dashboardProviders = {
${providerEntries.join("\n")}
};

export function getDashboardViewData(userId: string) {
  return getDashboardOverviewData(userId, dashboardProviders);
}`
    : `export async function getDashboardViewData(_userId: string) {
  return {};
}`;

  return `${imports.join("\n")}

export const workspaceMode: WorkspaceMode = "${mode}";

export async function getWorkspaceSession() {
  ${hasAuth ? "return getAuthWorkspaceSession();" : "return null;"}
}

${dashboardData}
`;
}

function createViewRuntimeSource(selectedModules: readonly string[]): string {
  const selected = new Set(selectedModules);
  if (!selected.has("shared")) return '"use client";\n\nexport {};\n';

  const hasAuth = selected.has("auth");
  const hasCredits = selected.has("credits");
  const hasSubscription = selected.has("subscription");
  const imports = [
    'import { dashboardConfig } from "@/config";',
    `import type {
  DashboardRuntime,
  WorkspaceCreditsState,
  WorkspacePlanState,
} from "@/features/shared/view";`,
    hasAuth
      ? 'import { useWorkspaceSessionController } from "@/features/auth/view";'
      : "",
    hasCredits
      ? 'import { useBalanceBadgeController } from "@/features/credits/view";'
      : "",
    hasSubscription
      ? 'import { usePlanBadgeController } from "@/features/subscription/view";'
      : "",
  ].filter(Boolean);
  const properties = [
    "    navigation: dashboardConfig.sidebarNav,",
    hasAuth ? "    user: session.user," : "    user: null,",
    `    capabilities: { credits: ${hasCredits}, subscription: ${hasSubscription} },`,
    hasAuth
      ? "    actions: { onSignOut: session.onSignOut },"
      : "    actions: { onSignOut: async () => {} },",
  ].filter(Boolean);

  return `"use client";

${imports.join("\n")}

export function useDashboardRuntime(): DashboardRuntime {
${hasAuth ? "  const session = useWorkspaceSessionController();" : ""}

  return {
${properties.join("\n")}
  };
}

export function useWorkspaceCredits(): WorkspaceCreditsState {
${hasCredits ? "  const credits = useBalanceBadgeController();" : ""}
  return ${hasCredits ? "{ balance: credits.balance, isPending: credits.isPending }" : "{ balance: 0, isPending: false }"};
}

export function useWorkspacePlan(): WorkspacePlanState {
${hasSubscription ? "  const plan = usePlanBadgeController();" : ""}
  return ${hasSubscription ? "{ id: plan.id }" : '{ id: "free" }'};
}
`;
}

function createDashboardLayoutSource(): string {
  return `import type { ReactNode } from "react";

import { redirect } from "@/i18n/routing";
import { getWorkspaceSession, workspaceMode } from "@/modules/view-data";
import { skinViews } from "@/modules/skin-views";

const View = skinViews["shared.dashboard-layout"];

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (workspaceMode !== "public") {
    const session = await getWorkspaceSession();
    if (!session?.user) redirect({ href: "/sign-in", locale });
  }

  return <View mode={workspaceMode}>{children}</View>;
}
`;
}

function createDashboardPageSource(selectedModules: readonly string[]): string {
  const selected = new Set(selectedModules);
  if (!selected.has("dashboard")) return "";
  if (!selected.has("credits")) {
    return `import { getLocale } from "next-intl/server";

import { skinViews } from "@/modules/skin-views";

const View = skinViews["shared.empty-dashboard"];

export default async function DashboardPage() {
  const locale = await getLocale();
  return <View locale={locale} />;
}
`;
  }

  return `import { redirect } from "@/i18n/routing";
import {
  getDashboardViewData,
  getWorkspaceSession,
} from "@/modules/view-data";
import { skinViews } from "@/modules/skin-views";

const View = skinViews["dashboard.overview"];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const data = await getDashboardViewData(session.user.id);
  return <View locale={locale} data={data} />;
}
`;
}

export async function writeWorkspaceComposition(
  target: string,
  selectedModules: readonly string[]
): Promise<void> {
  const selected = new Set(selectedModules);
  const hasDashboardGroupRoutes = DASHBOARD_GROUP.some((id) =>
    selected.has(id)
  );
  if (hasDashboardGroupRoutes && !selected.has("shared")) {
    throw new Error("Dashboard routes require the shared layout view");
  }

  if (selected.has("shared")) {
    await writeText(
      resolve(target, "src", "modules", "view-data.ts"),
      createViewDataSource(selectedModules)
    );
    await writeText(
      resolve(target, "src", "modules", "view-runtime.ts"),
      createViewRuntimeSource(selectedModules)
    );
  } else {
    await removePath(resolve(target, "src", "modules", "view-data.ts"));
    await removePath(resolve(target, "src", "modules", "view-runtime.ts"));
  }

  const dashboardGroup = resolve(
    target,
    "src",
    "app",
    "[locale]",
    "(dashboard)"
  );
  if (hasDashboardGroupRoutes) {
    await writeText(
      resolve(dashboardGroup, "layout.tsx"),
      createDashboardLayoutSource()
    );
    if (selected.has("dashboard")) {
      await writeText(
        resolve(dashboardGroup, "dashboard", "page.tsx"),
        createDashboardPageSource(selectedModules)
      );
    }
  }
}
