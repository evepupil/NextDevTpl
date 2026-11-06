import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/dashboard/view";

import { DashboardOverviewView } from "./overview";

export const views = {
  "dashboard.overview": DashboardOverviewView,
} satisfies SkinViews<ViewContracts>;
