import type { MarketingLayoutViewProps } from "@/features/marketing/view";
import { MarketingHeaderControllerView } from "@/features/marketing/view";
import { Footer, Header } from "@/skin/views/marketing/components";

export function MarketingLayoutView({ children }: MarketingLayoutViewProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeaderControllerView View={Header} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
