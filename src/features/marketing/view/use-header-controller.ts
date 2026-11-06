"use client";

import { mainNav, productsNav } from "@/config/nav";
import { useSession } from "@/lib/auth/client";

import type { MarketingHeaderController } from "./contracts";

export function useMarketingHeaderController(): MarketingHeaderController {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  return {
    isPending,
    user: user ? { image: user.image ?? null, name: user.name } : null,
    mainNav,
    productsNav,
  };
}
