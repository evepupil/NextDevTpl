import { defineModule } from "@/core/modules";

export const blogModule = defineModule({
  id: "blog",
  name: "Blog",
  description: "内容博客与文章列表",
  kind: "optional",
  dependencies: ["marketing"],
  routes: [
    {
      path: "/blog",
      source: "src/app/[locale]/(marketing)/blog/page.tsx",
    },
    {
      path: "/blog/[slug]",
      source: "src/app/[locale]/(marketing)/blog/[slug]/page.tsx",
    },
  ],
  navigation: [],
  translations: [],
  schema: [],
});
