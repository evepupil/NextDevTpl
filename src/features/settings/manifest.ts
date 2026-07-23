import { defineModule } from "@/core/modules";

export const settingsModule = defineModule({
  id: "settings",
  name: "Settings",
  description: "资料、安全、账单和账号设置",
  kind: "optional",
  dependencies: ["credits", "payment", "storage", "subscription"],
  routes: [
    {
      path: "/dashboard/settings",
      source: "src/app/[locale]/(dashboard)/dashboard/settings/page.tsx",
    },
  ],
  navigation: [
    {
      area: "dashboard",
      group: "dashboard",
      groupTranslationKey: "nav.dashboard",
      translationKey: "nav.settings",
      href: "/dashboard/settings",
      icon: "settings",
      order: 30,
    },
  ],
  translations: ["Settings"],
  schema: [],
});
