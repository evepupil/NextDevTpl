import { useTranslations } from "next-intl";

import type { EmptyDashboardViewProps } from "@/features/shared/view";

export function EmptyDashboardView(_props: EmptyDashboardViewProps) {
  const t = useTranslations("DashboardPages.dashboard");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
