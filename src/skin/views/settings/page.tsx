"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsPageViewProps } from "@/features/settings/view";

import { AccountSection } from "./components/account-section";
import { BillingSection } from "./components/billing-section";
import { CreditUsageSection } from "./components/credits/credit-usage-section";
import { SecuritySection } from "./components/security-section";

export function SettingsPageView({ user }: SettingsPageViewProps) {
  const tTabs = useTranslations("Settings.tabs");

  return (
    <div className="max-w-4xl space-y-8">
      <Tabs defaultValue="account" className="w-full">
        <div className="border-b border-border pb-2">
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            <TabsTrigger
              value="account"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("account")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("security")}
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("billing")}
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("usage")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="mt-8 space-y-10 pl-4">
          <AccountSection user={user} />
        </TabsContent>

        <TabsContent value="security" className="mt-8 pl-4">
          <SecuritySection />
        </TabsContent>

        <TabsContent value="billing" className="mt-8 pl-4">
          <BillingSection />
        </TabsContent>

        <TabsContent value="usage" className="mt-8 pl-4">
          <CreditUsageSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
