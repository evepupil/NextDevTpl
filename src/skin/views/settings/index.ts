import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/settings/view";

import { SettingsPageView } from "./page";

export const views = {
  "settings.page": SettingsPageView,
} satisfies SkinViews<ViewContracts>;
