import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/marketing/view";
import { MarketingLayoutView } from "@/skin/layouts/marketing";
import { Header } from "./components/header";
import { MarketingHomeView } from "./home";
import { MarketingLegalView } from "./legal";

export const views = {
  "marketing.header": Header,
  "marketing.layout": MarketingLayoutView,
  "marketing.home": MarketingHomeView,
  "marketing.legal": MarketingLegalView,
} satisfies SkinViews<ViewContracts>;
