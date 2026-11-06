import { useTranslations } from "next-intl";

import type { EmptyDashboardViewProps } from "@/features/shared/view";

export function EmptyDashboardView({ locale }: EmptyDashboardViewProps) {
  const t = useTranslations("Dashboard.pages");
  return (
    <section
      className="grid min-h-64 content-center gap-3 border-y border-border py-10"
      data-locale={locale}
      data-skin-view="shared.empty-dashboard"
    >
      <p className="font-mono text-xs font-semibold uppercase text-primary">
        {locale === "zh" ? "NextDevTpl / 工作区" : "NextDevTpl / Workspace"}
      </p>
      <h1 className="break-words font-mono text-3xl font-semibold">
        {t("dashboard")}
      </h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {locale === "zh"
          ? "工作区摘要将在可用时显示在这里。"
          : "Your workspace summary will appear here when available."}
      </p>
    </section>
  );
}
