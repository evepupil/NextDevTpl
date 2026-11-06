"use client";

import { dashboardConfig } from "@/config";
import { useWorkspaceSessionController } from "@/features/auth/view";
import { useBalanceBadgeController } from "@/features/credits/view";
import type {
  DashboardRuntime,
  WorkspaceCreditsState,
  WorkspacePlanState,
} from "@/features/shared/view";
import { usePlanBadgeController } from "@/features/subscription/view";

export function useDashboardRuntime(): DashboardRuntime {
  const session = useWorkspaceSessionController();

  return {
    navigation: dashboardConfig.sidebarNav,
    user: session.user,
    capabilities: { credits: true, subscription: true },
    actions: { onSignOut: session.onSignOut },
  };
}

export function useWorkspaceCredits(): WorkspaceCreditsState {
  const credits = useBalanceBadgeController();
  return { balance: credits.balance, isPending: credits.isPending };
}

export function useWorkspacePlan(): WorkspacePlanState {
  const plan = usePlanBadgeController();
  return { id: plan.id };
}
