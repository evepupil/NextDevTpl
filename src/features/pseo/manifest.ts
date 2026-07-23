import { defineModule } from "@/core/modules";

export const pseoModule = defineModule({
  id: "pseo",
  name: "Programmatic SEO",
  description: "结构化 SEO 落地页和静态参数",
  kind: "optional",
  dependencies: ["marketing"],
  routes: [
    {
      path: "/pseo",
      source: "src/app/[locale]/(marketing)/pseo/page.tsx",
    },
    {
      path: "/pseo/[slug]",
      source: "src/app/[locale]/(marketing)/pseo/[slug]/page.tsx",
    },
  ],
  navigation: [],
  translations: [],
  schema: [],
});
