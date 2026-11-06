import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/dashboard/view";

import { DashboardOverview } from "./overview";

export const views = {
  "dashboard.overview": DashboardOverview,
} satisfies SkinViews<ViewContracts>;
