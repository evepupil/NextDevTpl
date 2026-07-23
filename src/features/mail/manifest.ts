import { defineModule } from "@/core/modules";

export const mailModule = defineModule({
  id: "mail",
  name: "Mail",
  description: "事务邮件、邮件模板和 Newsletter",
  kind: "core",
  dependencies: [],
  routes: [],
  navigation: [],
  translations: [],
  schema: ["mail"],
});
