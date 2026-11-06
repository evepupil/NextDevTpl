"use client";

import { footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site";

import type { MarketingFooterController } from "./contracts";
import {
  filterMarketingNavigation,
  marketingSiteNavigation,
} from "./site-navigation";

export function useMarketingFooterController(): MarketingFooterController {
  return {
    siteName: siteConfig.name,
    productLinks: filterMarketingNavigation(
      footerNav.product,
      marketingSiteNavigation
    ),
    legalLinks: filterMarketingNavigation(
      footerNav.legal,
      marketingSiteNavigation
    ),
    socialLinks: {
      github: siteConfig.links.github,
      twitter: siteConfig.links.twitter,
    },
  };
}
