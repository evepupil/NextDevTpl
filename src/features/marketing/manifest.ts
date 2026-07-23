import { defineModule } from "@/core/modules";

export const marketingModule = defineModule({
  id: "marketing",
  name: "Marketing",
  description: "首页、定价、页头页脚与营销内容",
  kind: "optional",
  dependencies: ["payment", "shared"],
  routes: [
    {
      path: "/",
      source: "src/app/[locale]/(marketing)/page.tsx",
    },
    {
      path: "/legal/[slug]",
      source: "src/app/[locale]/(marketing)/legal/[slug]/page.tsx",
    },
  ],
  navigation: [],
  translations: [
    "HomePage",
    "Hero",
    "Features",
    "HowItWorks",
    "UseCases",
    "Testimonials",
    "FAQ",
    "CTA",
    "Header",
    "Navigation",
    "Pricing",
    "Footer",
  ],
  schema: [],
});
