import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/shared/view";

import { DashboardLayoutView } from "@/skin/layouts/dashboard";

import { EmptyDashboardView } from "./empty-dashboard";

export { PlanBadge } from "./plan-badge";
export type { BadgeSize, PlanType } from "./plan-badge";

export const views = {
  "shared.dashboard-layout": DashboardLayoutView,
  "shared.empty-dashboard": EmptyDashboardView,
} satisfies SkinViews<ViewContracts>;
