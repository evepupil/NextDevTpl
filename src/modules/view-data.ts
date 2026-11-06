import type { WorkspaceMode } from "@/features/shared/view";
import { getDashboardCredits } from "@/features/credits/server";
import { getDashboardPlan } from "@/features/subscription/server";
import { getDashboardOverviewData } from "@/features/dashboard/server";
import { getWorkspaceSession as readWorkspaceSession } from "@/features/auth/server";
import type { DashboardOverviewProviders } from "@/features/dashboard/view";

export const workspaceMode: WorkspaceMode = "workspace";

const dashboardProviders = {
  loadCredits: getDashboardCredits,
  loadPlan: getDashboardPlan,
} satisfies DashboardOverviewProviders;

export async function getWorkspaceSession() {
  return readWorkspaceSession();
}

export async function getDashboardViewData(userId: string) {
  return getDashboardOverviewData(userId, dashboardProviders);
}
