import { defineModule } from "@/core/modules";

export const paymentModule = defineModule({
  id: "payment",
  name: "Payment",
  description: "支付结账、订阅生命周期和 Webhook",
  kind: "optional",
  dependencies: ["subscription"],
  routes: [
    {
      path: "/api/webhooks/creem",
      source: "src/app/api/webhooks/creem/route.ts",
    },
  ],
  navigation: [],
  translations: [],
  schema: [],
});
