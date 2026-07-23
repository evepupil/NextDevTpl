import { defineModule } from "@/core/modules";

export const authModule = defineModule({
  id: "auth",
  name: "Authentication",
  description: "登录、注册、会话和账号安全",
  kind: "core",
  dependencies: ["mail", "shared"],
  routes: [
    {
      path: "/sign-in",
      source: "src/app/[locale]/(auth)/sign-in/page.tsx",
    },
    {
      path: "/sign-up",
      source: "src/app/[locale]/(auth)/sign-up/page.tsx",
    },
    {
      path: "/forgot-password",
      source: "src/app/[locale]/(auth)/forgot-password/page.tsx",
    },
    {
      path: "/api/auth/[...all]",
      source: "src/app/api/auth/[...all]/route.ts",
    },
  ],
  navigation: [],
  translations: ["Auth"],
  schema: ["auth"],
});
