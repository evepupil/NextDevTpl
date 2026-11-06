import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/pseo/view";

import { PseoDetailView } from "./pseo-detail";
import { PseoListView } from "./pseo-list";

export const views = {
  "pseo.detail": PseoDetailView,
  "pseo.list": PseoListView,
} satisfies SkinViews<ViewContracts>;
