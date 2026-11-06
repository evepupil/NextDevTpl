import { getTranslations } from "next-intl/server";

import type { EmptyDashboardViewProps } from "@/features/shared/view";

export async function EmptyDashboardView({ locale }: EmptyDashboardViewProps) {
  const t = await getTranslations({
    locale,
    namespace: "DashboardPages.dashboard",
  });

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
