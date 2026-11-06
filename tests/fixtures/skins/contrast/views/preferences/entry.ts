import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/settings/view";

import { SettingsPage } from "./page";

export const views = {
  "settings.page": SettingsPage,
} satisfies SkinViews<ViewContracts>;
