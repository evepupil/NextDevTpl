import { defineModule } from "@/core/modules";

export const adminModule = defineModule({
  id: "admin",
  name: "Admin",
  description: "管理后台、用户管理与平台运营入口",
  kind: "optional",
  dependencies: ["shared", "support"],
  routes: [
    {
      path: "/admin",
      source: "src/app/[locale]/(admin)/admin/page.tsx",
    },
    {
      path: "/admin/users",
      source: "src/app/[locale]/(admin)/admin/users/page.tsx",
    },
  ],
  navigation: [
    {
      area: "admin",
      group: "control-panel",
      groupTranslationKey: "nav.controlPanel",
      translationKey: "nav.dashboard",
      href: "/admin",
      icon: "dashboard",
      order: 10,
    },
    {
      area: "admin",
      group: "control-panel",
      groupTranslationKey: "nav.controlPanel",
      translationKey: "nav.userManagement",
      href: "/admin/users",
      icon: "users",
      order: 20,
    },
  ],
  translations: ["AdminSidebar"],
  schema: [],
});
