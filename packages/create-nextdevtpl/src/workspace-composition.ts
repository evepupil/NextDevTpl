import { resolve } from "node:path";

import { removePath, writeText } from "./filesystem.js";

const DASHBOARD_GROUP = [
  "dashboard",
  "credits",
  "settings",
  "support",
] as const;

function createSiteNavigationSource(
  selectedModules: readonly string[],
  docsEnabled: boolean
): string {
  const selected = new Set(selectedModules);
  const homeHref = selected.has("marketing")
    ? "/"
    : selected.has("dashboard")
      ? "/dashboard"
      : selected.has("auth")
        ? "/sign-in"
        : "/";
  const hasMarketing = selected.has("marketing");

  return `export interface SiteNavigation {
  blogHref: string | null;
  cookiePolicyHref: string | null;
  docsHref: string | null;
  homeHref: string;
  pseoHref: string | null;
  privacyHref: string | null;
  termsHref: string | null;
}

export const siteNavigation = {
  blogHref: ${JSON.stringify(selected.has("blog") ? "/blog" : null)},
  cookiePolicyHref: ${JSON.stringify(hasMarketing ? "/legal/cookie-policy" : null)},
  docsHref: ${JSON.stringify(docsEnabled ? "/docs" : null)},
  homeHref: ${JSON.stringify(homeHref)},
  pseoHref: ${JSON.stringify(selected.has("pseo") ? "/pseo" : null)},
  privacyHref: ${JSON.stringify(hasMarketing ? "/legal/privacy" : null)},
  termsHref: ${JSON.stringify(hasMarketing ? "/legal/terms" : null)},
} as const satisfies SiteNavigation;
`;
}

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
  return `import { DashboardPage } from "@/modules/view-pages";

export default async function DashboardRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <DashboardPage locale={locale} />;
}
`;
}

function createViewPagesSource(selectedModules: readonly string[]): string {
  const selected = new Set(selectedModules);
  const hasPageFacade = ["dashboard", "settings", "support"].some((id) =>
    selected.has(id)
  );
  const needsWorkspaceSession = selected.has("auth") && hasPageFacade;
  const imports = [
    hasPageFacade ? 'import { skinViews } from "@/modules/skin-views";' : "",
    needsWorkspaceSession
      ? 'import { getWorkspaceSession } from "@/modules/view-data";'
      : "",
    selected.has("dashboard") && selected.has("credits")
      ? 'import { getDashboardViewData } from "@/modules/view-data";'
      : "",
    selected.has("support")
      ? 'import { getSupportDetailViewData, getSupportListViewData } from "@/features/support/server";'
      : "",
    selected.has("support")
      ? 'import { notFound } from "next/navigation";'
      : "",
    needsWorkspaceSession ? 'import { redirect } from "@/i18n/routing";' : "",
    selected.has("support")
      ? 'import type { SupportDetailPageInput } from "@/core/support/contracts";'
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const dashboard = selected.has("dashboard")
    ? `export async function DashboardPage({ locale }: { locale: string }) {
${selected.has("auth") ? '  const session = await getWorkspaceSession();\n  if (!session?.user) return redirect({ href: "/sign-in", locale });\n' : ""}${
  selected.has("credits")
    ? `  const data = await getDashboardViewData(${selected.has("auth") ? "session.user.id" : '""'});
  const View = skinViews["dashboard.overview"];
  return <View locale={locale} data={data} />;`
    : `  const View = skinViews["shared.empty-dashboard"];
  return <View locale={locale} />;`
}
}
`
    : "";
  const settings = selected.has("settings")
    ? `export async function SettingsPage({ locale }: { locale: string }) {
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const View = skinViews["settings.page"];
  return <View user={{ id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image ?? null }} />;
}
`
    : "";
  const support = selected.has("support")
    ? `export async function SupportListPage({ locale }: { locale: string }) {
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const data = await getSupportListViewData(session.user.id, locale);
  const View = skinViews["support.list"];
  return <View {...data} />;
}

export async function SupportDetailPage(input: SupportDetailPageInput) {
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale: input.locale });
  const data = await getSupportDetailViewData({ ...input, userId: session.user.id });
  if (!data) notFound();
  const View = skinViews["support.detail"];
  return <View {...data} />;
}
`
    : "";
  return `${imports}\n\n${dashboard}${settings}${support}`;
}

export async function writeWorkspaceComposition(
  target: string,
  selectedModules: readonly string[],
  options: { docsEnabled?: boolean } = {}
): Promise<void> {
  const selected = new Set(selectedModules);
  await writeText(
    resolve(target, "src", "modules", "view-pages.tsx"),
    createViewPagesSource(selectedModules)
  );
  await writeText(
    resolve(target, "src", "modules", "site-navigation.ts"),
    createSiteNavigationSource(selectedModules, options.docsEnabled ?? true)
  );
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
