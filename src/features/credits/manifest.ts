import { defineModule } from "@/core/modules";

export const creditsModule = defineModule({
  id: "credits",
  name: "Credits",
  description: "积分账户、批次、交易与过期处理",
  kind: "optional",
  dependencies: ["payment"],
  routes: [
    {
      path: "/dashboard/credits",
      source: "src/app/[locale]/(dashboard)/dashboard/credits/page.tsx",
    },
    {
      path: "/dashboard/credits/buy",
      source: "src/app/[locale]/(dashboard)/dashboard/credits/buy/page.tsx",
    },
    {
      path: "/api/jobs/credits/expire",
      source: "src/app/api/jobs/credits/expire/route.ts",
    },
  ],
  navigation: [
    {
      area: "dashboard",
      group: "dashboard",
      groupTranslationKey: "nav.dashboard",
      translationKey: "nav.credits",
      href: "/dashboard/credits",
      icon: "coins",
      order: 20,
    },
  ],
  translations: ["CreditTransactions"],
  schema: ["credits"],
});
