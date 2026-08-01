import { defineModule } from "@/core/modules";

export const analyticsModule = defineModule({
  id: "analytics",
  name: "Analytics",
  description: "页面分析与可选监控脚本",
  kind: "optional",
  dependencies: [],
  routes: [
    {
      path: "/api/telemetry",
      source: "src/app/api/telemetry/route.ts",
    },
  ],
  navigation: [],
  translations: [],
  schema: [],
});
