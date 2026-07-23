import { defineModule } from "@/core/modules";

export const dashboardModule = defineModule({
  id: "dashboard",
  name: "Dashboard",
  description: "登录后的基础工作区与侧边栏框架",
  kind: "core",
  dependencies: ["shared"],
  routes: [
    {
      path: "/dashboard",
      source: "src/app/[locale]/(dashboard)/dashboard/page.tsx",
    },
  ],
  navigation: [
    {
      area: "dashboard",
      group: "dashboard",
      groupTranslationKey: "nav.dashboard",
      translationKey: "nav.dashboard",
      href: "/dashboard",
      icon: "dashboard",
      order: 10,
    },
  ],
  translations: ["Dashboard", "DashboardPages"],
  schema: [],
});
