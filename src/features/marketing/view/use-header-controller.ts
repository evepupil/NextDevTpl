"use client";

import { mainNav, productsNav } from "@/config/nav";
import { useSession } from "@/lib/auth/client";

import type { MarketingHeaderController } from "./contracts";
import {
  filterMarketingNavigation,
  marketingSiteNavigation,
} from "./site-navigation";

export function useMarketingHeaderController(): MarketingHeaderController {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  return {
    isPending,
    user: user ? { image: user.image ?? null, name: user.name } : null,
    mainNav: filterMarketingNavigation(mainNav, marketingSiteNavigation),
    productsNav,
  };
}
