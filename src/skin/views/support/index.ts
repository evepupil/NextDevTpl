import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/support/view";

import { SupportDetailView } from "./detail";
import { SupportListView } from "./list";
import { SupportNewView } from "./new";

export const views = {
  "support.list": SupportListView,
  "support.new": SupportNewView,
  "support.detail": SupportDetailView,
} satisfies SkinViews<ViewContracts>;
