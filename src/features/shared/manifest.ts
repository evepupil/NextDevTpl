import { defineModule } from "@/core/modules";

export const sharedModule = defineModule({
  id: "shared",
  name: "Shared UI",
  description: "跨页面复用的基础组件、图标和 Provider",
  kind: "core",
  dependencies: [],
  routes: [],
  navigation: [],
  translations: [
    "Common",
    "Cookie",
    "Dashboard",
    "DashboardPages",
    "Subscription",
    "Theme",
  ],
  schema: [],
  views: [
    { id: "shared.dashboard-layout", kind: "layout" },
    { id: "shared.empty-dashboard", kind: "page" },
  ],
  telemetryEvents: ["api.request.failed", "action.failed", "job.failed"],
});
