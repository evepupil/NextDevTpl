"use client";

import { useLocale, useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsPageViewProps } from "@/features/settings/view";

import { PageTitle } from "../shared/fields";
import { AccountSection } from "./account";
import { BillingSection } from "./billing";
import { SecuritySection } from "./security";
import { UsageSection } from "./usage";

export function SettingsPage({ user }: SettingsPageViewProps) {
  const locale = useLocale();
  const t = useTranslations("Settings");
  const tDashboard = useTranslations("Dashboard.pages");
  return (
    <div className="min-w-0" data-skin-view="settings.page">
      <PageTitle
        description={t("general.description")}
        eyebrow={locale === "zh" ? "NextDevTpl / 账户" : "NextDevTpl / Account"}
        title={tDashboard("settings")}
      />
      <Tabs className="grid gap-6" defaultValue="account">
        <TabsList
          aria-label={locale === "zh" ? "设置栏目" : "Settings sections"}
          className="h-auto flex-wrap justify-start rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            value="account"
          >
            {t("tabs.account")}
          </TabsTrigger>
          <TabsTrigger
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            value="security"
          >
            {t("tabs.security")}
          </TabsTrigger>
          <TabsTrigger
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            value="billing"
          >
            {t("tabs.billing")}
          </TabsTrigger>
          <TabsTrigger
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            value="usage"
          >
            {t("tabs.usage")}
          </TabsTrigger>
        </TabsList>
        <TabsContent className="mt-0 focus-visible:ring-0" value="account">
          <AccountSection user={user} />
        </TabsContent>
        <TabsContent className="mt-0 focus-visible:ring-0" value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent className="mt-0 focus-visible:ring-0" value="billing">
          <BillingSection />
        </TabsContent>
        <TabsContent className="mt-0 focus-visible:ring-0" value="usage">
          <UsageSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
