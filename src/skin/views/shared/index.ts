import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/shared/view";

import { DashboardLayoutView } from "@/skin/layouts/dashboard";

import { EmptyDashboardView } from "./empty-dashboard";

export type {
  BadgeSize,
  PlanBadgeProps,
  PlanType,
} from "@/components/ui/plan-badge";
export { PlanBadge } from "@/components/ui/plan-badge";

export const views = {
  "shared.dashboard-layout": DashboardLayoutView,
  "shared.empty-dashboard": EmptyDashboardView,
} satisfies SkinViews<ViewContracts>;
