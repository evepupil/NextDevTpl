import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/shared/view";

import { DashboardLayoutView } from "./dashboard-layout";
import { EmptyDashboardView } from "./empty-dashboard";

export const views = {
  "shared.dashboard-layout": DashboardLayoutView,
  "shared.empty-dashboard": EmptyDashboardView,
} satisfies SkinViews<ViewContracts>;
