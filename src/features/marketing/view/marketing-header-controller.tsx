"use client";

import type { MarketingHeaderViewHostProps } from "./contracts";
import { useMarketingHeaderController } from "./use-header-controller";

export function MarketingHeaderControllerView({
  View,
}: MarketingHeaderViewHostProps) {
  const controller = useMarketingHeaderController();
  return <View {...controller} />;
}
