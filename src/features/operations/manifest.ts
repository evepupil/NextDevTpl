import { defineModule } from "@/core/modules";

export const operationsModule = defineModule({
  id: "operations",
  name: "Operations",
  description: "运营驾驶舱、指标聚合和每日快照",
  kind: "optional",
  dependencies: ["admin", "payment"],
  routes: [
    {
      path: "/admin/operations",
      source: "src/app/[locale]/(admin)/admin/operations/page.tsx",
    },
    {
      path: "/api/jobs/operations/snapshot",
      source: "src/app/api/jobs/operations/snapshot/route.ts",
    },
    {
      path: "/api/jobs/operations/alerts",
      source: "src/app/api/jobs/operations/alerts/route.ts",
    },
  ],
  navigation: [
    {
      area: "admin",
      group: "control-panel",
      groupTranslationKey: "nav.controlPanel",
      translationKey: "nav.operations",
      href: "/admin/operations",
      icon: "activity",
      order: 15,
    },
  ],
  translations: [],
  schema: ["operations"],
});
