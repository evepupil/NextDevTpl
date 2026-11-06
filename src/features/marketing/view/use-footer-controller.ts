"use client";

import { footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site";

import type { MarketingFooterController } from "./contracts";

export function useMarketingFooterController(): MarketingFooterController {
  return {
    siteName: siteConfig.name,
    productLinks: footerNav.product,
    legalLinks: footerNav.legal,
    socialLinks: {
      github: siteConfig.links.github,
      twitter: siteConfig.links.twitter,
    },
  };
}
