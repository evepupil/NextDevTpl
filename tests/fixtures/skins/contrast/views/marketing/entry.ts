import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/marketing/view";

import { MarketingHeader } from "./header";
import { MarketingHome } from "./home";
import { MarketingLayout } from "./layout";
import { MarketingLegal } from "./legal";

export const views = {
  "marketing.header": MarketingHeader,
  "marketing.layout": MarketingLayout,
  "marketing.home": MarketingHome,
  "marketing.legal": MarketingLegal,
} satisfies SkinViews<ViewContracts>;
