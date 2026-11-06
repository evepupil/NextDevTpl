"use client";

import type { MarketingLayoutViewProps } from "@/features/marketing/view";
import { MarketingHeaderControllerView } from "@/features/marketing/view";

import { MarketingFooter } from "./footer";
import { MarketingHeader } from "./header";

export function MarketingLayout({ children }: MarketingLayoutViewProps) {
  return (
    <div
      className="min-h-screen"
      data-skin="contrast"
      data-skin-view="marketing.layout"
    >
      <MarketingHeaderControllerView View={MarketingHeader} />
      {children}
      <MarketingFooter />
    </div>
  );
}
