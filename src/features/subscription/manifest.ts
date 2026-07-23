import { defineModule } from "@/core/modules";

export const subscriptionModule = defineModule({
  id: "subscription",
  name: "Subscription",
  description: "订阅状态、计划识别和权益计算",
  kind: "optional",
  dependencies: [],
  routes: [],
  navigation: [],
  translations: ["Subscription"],
  schema: ["subscription"],
});
