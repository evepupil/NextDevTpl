import { defineModule } from "@/core/modules";

export const supportModule = defineModule({
  id: "support",
  name: "Support",
  description: "用户工单、管理员回复和状态管理",
  kind: "optional",
  dependencies: ["credits"],
  routes: [
    {
      path: "/dashboard/support",
      source: "src/app/[locale]/(dashboard)/dashboard/support/page.tsx",
    },
    {
      path: "/dashboard/support/new",
      source: "src/app/[locale]/(dashboard)/dashboard/support/new/page.tsx",
    },
    {
      path: "/dashboard/support/[id]",
      source: "src/app/[locale]/(dashboard)/dashboard/support/[id]/page.tsx",
    },
  ],
  navigation: [
    {
      area: "dashboard",
      group: "dashboard",
      groupTranslationKey: "nav.dashboard",
      translationKey: "nav.support",
      href: "/dashboard/support",
      icon: "headset",
      order: 40,
    },
  ],
  translations: ["Support"],
  schema: ["support"],
  views: [
    { id: "support.list", kind: "page" },
    { id: "support.new", kind: "page" },
    { id: "support.detail", kind: "page" },
  ],
  telemetryEvents: [],
});
