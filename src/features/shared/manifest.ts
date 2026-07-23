import { defineModule } from "@/core/modules";

export const sharedModule = defineModule({
  id: "shared",
  name: "Shared UI",
  description: "跨页面复用的基础组件、图标和 Provider",
  kind: "core",
  dependencies: [],
  routes: [],
  navigation: [],
  translations: ["Common", "Cookie"],
  schema: [],
});
