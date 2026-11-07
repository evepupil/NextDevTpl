import { readdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { removePath, writeText } from "./filesystem.js";
import type { RecipeCatalog } from "./types.js";
import { writeDemoSkinViews } from "./view-composition.js";

const DEMO_FEATURES = [
  "auth",
  "blog",
  "credits",
  "dashboard",
  "mail",
  "marketing",
  "payment",
  "pseo",
  "settings",
  "shared",
  "subscription",
  "storage",
  "support",
] as const;

const DEMO_BACKEND_PATHS = [
  "drizzle",
  "drizzle.config.ts",
  "src/adapters",
  "src/app/api",
  "src/app/image-proxy",
  "src/app/[locale]/(admin)",
  "src/app/[locale]/docs",
  "src/app/[locale]/(marketing)/demo",
  "src/app/[locale]/(dashboard)/dashboard/credits/buy/buy-credits-view.tsx",
  "src/db",
  "src/lib/auth",
  "src/lib/safe-action.ts",
  "src/lib/runtime-config.ts",
  "src/lib/telemetry",
  "src/services",
  "src/instrumentation.ts",
  "sentry.client.config.ts",
  "sentry.edge.config.ts",
  "sentry.server.config.ts",
  "src/lib/rate-limit",
  "src/lib/monitoring",
  "src/lib/analytics",
  "src/lib/logger",
  "src/lib/email",
  "src/lib/payment",
  "src/lib/storage",
  "src/lib/ai",
  "src/lib/api-logger.ts",
  "src/lib/cloudflare",
  "src/lib/fingerprint",
  "src/lib/health",
  "src/lib/jobs",
  "src/lib/telemetry",
  "src/lib/index.ts",
  "src/core/services",
  "src/test",
  "src/content/docs",
  "scripts/check-generated-migrations.mjs",
  "scripts/reset-test-db.ts",
  "deploy/check-health.mjs",
  "deploy/verify-production-health.mjs",
  "deploy/server/build.sh",
  "src/config/payment.ts",
  "src/config/subscription-plan.ts",
  "src/config/auth-navigation.ts",
  "wrangler.jsonc",
  "open-next.config.ts",
  "cloudflare",
  "compose.yaml",
  "Dockerfile",
  ".dockerignore",
  ".dev.vars.example",
] as const;

const DEMO_CONTROLLER_BARRELS: Readonly<Record<string, string>> = {
  auth: `export * from "./contracts.js";
export { authSiteName } from "./site-data.js";
export type { AuthSiteNavigation } from "./site-navigation.js";
export { authSiteNavigation } from "./site-navigation.js";
export { useForgotPasswordController, useResetPasswordController, useSignInController, useSignUpController, useWorkspaceSessionController } from "@/core/skin/demo/controllers/auth";
`,
  credits: `export * from "./contracts.js";
export { isIncomeTransactionType } from "./transaction-direction.js";
export { useBalanceBadgeController, useCreditUsageController } from "@/core/skin/demo/controllers/credits";
`,
  marketing: `export * from "./contracts.js";
export { marketingFeatureCards } from "./presentation.js";
export type { MarketingSiteNavigation } from "./site-navigation.js";
export { filterMarketingNavigation, marketingSiteNavigation } from "./site-navigation.js";
export { MarketingHeaderControllerView } from "./marketing-header-controller.js";
export { useMarketingFooterController, useMarketingHeaderController, usePricingController } from "@/core/skin/demo/controllers/marketing";
`,
  settings: `export * from "./contracts.js";
export { useSettingsAccountController, useSettingsBillingController, useSettingsSecurityController } from "@/core/skin/demo/controllers/settings";
`,
  subscription: `export * from "./contracts.js";
export { usePlanBadgeController } from "@/core/skin/demo/controllers/subscription";
`,
  support: `export * from "./contracts.js";
export { addTicketMessageSchema, createTicketSchema } from "../schemas/ticket.js";
export { useCreateTicketController, useSupportReplyController } from "@/core/skin/demo/controllers/support";
`,
};

export async function pruneDemoBackendFiles(target: string): Promise<void> {
  for (const path of DEMO_BACKEND_PATHS) {
    await removePath(join(target, ...path.split("/")));
  }

  const libRoot = resolve(target, "src", "lib");
  for (const entry of await readdir(libRoot, { withFileTypes: true })) {
    if (
      entry.name !== "cookie-consent.ts" &&
      entry.name !== "source.ts" &&
      entry.name !== "utils.ts" &&
      entry.name !== "seo"
    ) {
      await removePath(join(libRoot, entry.name));
    }
  }

  const featuresRoot = resolve(target, "src", "features");
  for (const entry of await readdir(featuresRoot, { withFileTypes: true })) {
    const featureDirectory = join(featuresRoot, entry.name);
    if (!entry.isDirectory() || !DEMO_FEATURES.includes(entry.name as never)) {
      await removePath(featureDirectory);
      continue;
    }
    if (
      entry.name === "shared" ||
      entry.name === "blog" ||
      entry.name === "pseo"
    ) {
      continue;
    }
    if (entry.name === "support") {
      const schemasDirectory = join(featureDirectory, "schemas");
      for (const schema of await readdir(schemasDirectory, {
        withFileTypes: true,
      })) {
        if (!schema.isFile() || schema.name !== "ticket.ts") {
          await removePath(join(schemasDirectory, schema.name));
        }
      }
    }
    if (entry.name === "marketing") {
      const componentsDirectory = join(featureDirectory, "components");
      for (const component of await readdir(componentsDirectory, {
        withFileTypes: true,
      })) {
        if (
          !component.isFile() ||
          !["cookie-consent.tsx", "index.ts"].includes(component.name)
        ) {
          await removePath(join(componentsDirectory, component.name));
        }
      }
    }
    const viewRoot = join(featureDirectory, "view");
    const viewFiles = await readdir(viewRoot, { withFileTypes: true }).catch(
      async () => {
        for (const file of await readdir(featureDirectory, {
          withFileTypes: true,
        })) {
          if (file.name !== "manifest.ts") {
            await removePath(join(featureDirectory, file.name));
          }
        }
        return null;
      }
    );
    if (!viewFiles) continue;
    for (const file of viewFiles) {
      const allowed = new Set([
        "contracts.ts",
        "site-data.ts",
        "site-navigation.ts",
        "presentation.ts",
        "transaction-direction.ts",
        "index.ts",
        "marketing-header-controller.tsx",
      ]);
      if (!file.isFile() || !allowed.has(file.name)) {
        await removePath(join(viewRoot, file.name));
      }
    }
    for (const file of await readdir(featureDirectory, {
      withFileTypes: true,
    })) {
      if (
        file.name !== "view" &&
        file.name !== "manifest.ts" &&
        !(entry.name === "support" && file.name === "schemas") &&
        !(entry.name === "marketing" && file.name === "components") &&
        !(entry.name === "marketing" && file.name === "server.ts")
      ) {
        await removePath(join(featureDirectory, file.name));
      }
    }
    if (entry.name === "support") {
      await writeText(
        join(featureDirectory, "schemas", "index.ts"),
        `export * from "./ticket.js";\n`
      );
    }
    if (entry.name === "marketing") {
      await writeText(
        join(featureDirectory, "index.ts"),
        `export { CookieConsent } from "./components/cookie-consent.js";\n`
      );
    }
    const barrel = DEMO_CONTROLLER_BARRELS[entry.name];
    if (barrel) await writeText(join(viewRoot, "index.ts"), barrel);
    if (entry.name === "marketing") {
      await writeText(
        join(viewRoot, "marketing-header-controller.tsx"),
        `"use client";\n\nimport type { MarketingHeaderViewHostProps } from "./contracts.js";\nimport { useMarketingHeaderController } from "@/core/skin/demo/controllers/marketing";\n\nexport function MarketingHeaderControllerView({ View }: MarketingHeaderViewHostProps) {\n  const controller = useMarketingHeaderController();\n  return <View {...controller} />;\n}\n`
      );
    }
  }
}

export async function rewriteDemoProjectConfig(
  target: string,
  sourceDependencies: ReadonlySet<string>,
  skinDependencies: Readonly<Record<string, string>>
): Promise<void> {
  await writeText(
    resolve(target, "src", "config", "index.ts"),
    `export { adminConfig, adminNav, dashboardConfig, dashboardNav, footerNav, mainNav, marketingConfig, type NavGroup, type NavItem, type ProductNavGroup, type ProductNavItem, productsNav } from "./nav";\nexport { type SiteConfig, siteConfig } from "./site";\n`
  );
  await writeText(
    resolve(target, "next.config.mjs"),
    `import { dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nimport { createMDX } from "fumadocs-mdx/next";\nimport createNextIntlPlugin from "next-intl/plugin";\n\nconst withMDX = createMDX();\nconst withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");\nconst projectRoot = dirname(fileURLToPath(import.meta.url));\n\nconst nextConfig = {\n  output: "standalone",\n  outputFileTracingRoot: projectRoot,\n  webpack(config) {\n    config.resolve.extensionAlias = {\n      ...config.resolve.extensionAlias,\n      ".js": [".ts", ".tsx", ".js"],\n    };\n    return config;\n  },\n};\n\nexport default withMDX(withNextIntl(nextConfig));\n`
  );
  await writeText(
    resolve(target, "source.config.ts"),
    `import { defineCollections, frontmatterSchema } from "fumadocs-mdx/config";\nimport { z } from "zod";\n\nconst blogFrontmatter = frontmatterSchema.extend({\n  title: z.string(),\n  description: z.string().optional(),\n  date: z.string().or(z.date()),\n  author: z.string().optional(),\n  image: z.string().optional(),\n  tags: z.array(z.string()).optional(),\n});\n\nexport const blog = defineCollections({\n  dir: "src/content/blog",\n  schema: blogFrontmatter,\n  type: "doc",\n});\n\nconst legalFrontmatter = frontmatterSchema.extend({\n  title: z.string(),\n  date: z.string().or(z.date()),\n  description: z.string().optional(),\n});\n\nexport const legal = defineCollections({\n  dir: "src/content/legal",\n  schema: legalFrontmatter,\n  type: "doc",\n});\n`
  );
  await writeText(
    resolve(target, "src", "lib", "source.ts"),
    `import { blog, legal } from "../../.source/server";\n\nexport const blogPosts = blog;\nexport const legalDocs = legal;\n\nexport function getBlogPosts(locale: string) {\n  return blog.filter((post) => post.info.path.split("/")[0] === locale);\n}\n\nexport function getBlogPost(slug: string, locale: string) {\n  return getBlogPosts(locale).find((post) => post.info.path.split("/").at(-1)?.replace(/\\.mdx$/u, "") === slug);\n}\n\nexport function getBlogPostLocales(slug: string): string[] {\n  return [...new Set(blog.flatMap((post) => {\n    const [locale, filename] = post.info.path.split("/");\n    return filename?.replace(/\\.mdx$/u, "") === slug && locale ? [locale] : [];\n  }))];\n}\n\nexport function getAllBlogSlugs() {\n  return blog.map((post) => {\n    const [locale = "en", filename = ""] = post.info.path.split("/");\n    return { locale, slug: filename.replace(/\\.mdx$/u, "") };\n  });\n}\n\nexport function getLegalDocs(locale: string) {\n  return legal.filter((doc) => doc.info.path.split("/")[0] === locale);\n}\n\nexport function getLegalDoc(slug: string, locale: string) {\n  return getLegalDocs(locale).find((doc) => doc.info.path.split("/").at(-1)?.replace(/\\.mdx$/u, "") === slug);\n}\n\nexport function getAllLegalSlugs() {\n  return legal.map((doc) => {\n    const [locale = "en", filename = ""] = doc.info.path.split("/");\n    return { locale, slug: filename.replace(/\\.mdx$/u, "") };\n  });\n}\n`
  );
  await writeText(
    resolve(target, "deploy", "server", "README.md"),
    "# Server deployment\n\nRun pnpm build, then start the app with pnpm start or deploy/server/start.sh. This demo requires no database or business secrets.\n"
  );

  const packagePath = resolve(target, "package.json");
  const packageJson: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    name: string;
    private: boolean;
    scripts: Record<string, string>;
  } = JSON.parse(await readFile(packagePath, "utf8"));
  const fixedBuildDependencies = new Set([
    "@biomejs/biome",
    "@tailwindcss/postcss",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "fumadocs-core",
    "fumadocs-mdx",
    "fumadocs-ui",
    "next",
    "next-intl",
    "postcss",
    "react",
    "react-dom",
    "tailwindcss",
    "typescript",
    "tw-animate-css",
    "vitest",
    "zod",
  ]);
  const allowed = new Set([...sourceDependencies, ...fixedBuildDependencies]);
  for (const name of Object.keys(packageJson.dependencies)) {
    if (!allowed.has(name)) delete packageJson.dependencies[name];
  }
  for (const name of Object.keys(packageJson.devDependencies)) {
    if (!allowed.has(name)) delete packageJson.devDependencies[name];
  }
  Object.assign(packageJson.dependencies, skinDependencies);
  for (const name of Object.keys(packageJson.scripts)) {
    if (
      name.startsWith("db:") ||
      name.startsWith("cf:") ||
      name.startsWith("deploy:") ||
      name.startsWith("palette:") ||
      name.startsWith("visual:") ||
      name.startsWith("verify:") ||
      name.startsWith("release:") ||
      [
        "verify:generated",
        "verify:compatibility",
        "verify:compatibility:structure",
        "verify:health",
        "skin:check",
        "skin:hash",
        "palette:sync",
        "palette:check",
        "prepare:demo-contract",
      ].includes(name)
    ) {
      delete packageJson.scripts[name];
    }
  }
  packageJson.name =
    basename(resolve(target))
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/gu, "-") || "nextdevtpl-demo";
  packageJson.private = true;
  packageJson.scripts.dev = "next dev --webpack";
  packageJson.scripts.postinstall = "fumadocs-mdx";
  packageJson.scripts.build = "next build --webpack";
  packageJson.scripts.lint = "biome lint .";
  packageJson.scripts.format = "biome format --write .";
  packageJson.scripts.check = "biome check --write .";
  packageJson.scripts.typecheck = "tsc --noEmit";
  packageJson.scripts.test = "vitest";
  packageJson.scripts["test:run"] = "vitest run";
  if (packageJson.scripts["test:ui"]) {
    packageJson.scripts["test:ui"] = "vitest --ui";
  }
  if (packageJson.scripts["test:coverage"]) {
    packageJson.scripts["test:coverage"] = "vitest run --coverage";
  }
  await writeText(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  await writeText(
    resolve(target, ".env.example"),
    "# No environment variables are required for this demo project.\n"
  );
}

export async function writeDemoRuntime(target: string): Promise<void> {
  await writeText(
    resolve(target, "src", "modules", "app-runtime.tsx"),
    `import type { ReactNode } from "react";\n\nimport { initialDemoData } from "@/core/skin/demo/data";\nimport { DemoStoreProvider } from "@/core/skin/demo/store";\n\nexport function AppRuntimeProvider({ children }: { children: ReactNode }) {\n  return <DemoStoreProvider initialData={initialDemoData}>{children}</DemoStoreProvider>;\n}\n`
  );
  await writeText(
    resolve(target, "src", "modules", "view-runtime.ts"),
    `"use client";\n\nimport { dashboardConfig } from "@/config/nav";\nimport { resolveDemoAssetUrl } from "@/core/skin/demo/projections";\nimport { useDemoStore } from "@/core/skin/demo/store";\nimport type { DashboardRuntime, WorkspaceCreditsState, WorkspacePlanState } from "@/features/shared/view";\nimport { useRouter } from "@/i18n/routing";\n\nexport function useDashboardRuntime(): DashboardRuntime {\n  const { state, actions } = useDemoStore();\n  const router = useRouter();\n  const user = state.sessionUserId ? state.data.workspace.user : null;\n  return {\n    navigation: dashboardConfig.sidebarNav,\n    user: user ? { ...user, image: state.avatarPreview ?? resolveDemoAssetUrl(user.image) } : null,\n    capabilities: { credits: true, subscription: true },\n    actions: { onSignOut: async () => { actions.signOut(); router.push("/sign-in"); } },\n  };\n}\n\nexport function useWorkspaceCredits(): WorkspaceCreditsState {\n  const { state } = useDemoStore();\n  return { balance: state.data.workspace.credits.balance, isPending: false };\n}\n\nexport function useWorkspacePlan(): WorkspacePlanState {\n  const { state } = useDemoStore();\n  return { id: state.data.workspace.plan.id };\n}\n`
  );
  await writeText(
    resolve(target, "src", "modules", "view-data.ts"),
    `import { initialDemoData } from "@/core/skin/demo/data";\nimport { projectDashboardOverview, projectSupportDetail, projectSupportList } from "@/core/skin/demo/projections";\nimport type { WorkspaceUser } from "@/features/shared/view";\n\nexport const workspaceMode = "workspace" as const;\n\nexport async function getWorkspaceSession(): Promise<{ user: WorkspaceUser } | null> {\n  return { user: { ...initialDemoData.workspace.user } };\n}\n\nexport async function getDashboardViewData(_userId: string) {\n  return projectDashboardOverview(initialDemoData);\n}\n\nexport async function getSupportListViewData(_userId: string, locale: string) {\n  return projectSupportList(initialDemoData, locale);\n}\n\nexport async function getSupportDetailViewData(input: { locale: string; ticketId: string; userId?: string }) {\n  return projectSupportDetail(initialDemoData, input.ticketId, input.locale);\n}\n`
  );
  await writeText(
    resolve(target, "src", "app", "[locale]", "(dashboard)", "layout.tsx"),
    `import type { ReactNode } from "react";\n\nimport { redirect } from "@/i18n/routing";\nimport { getWorkspaceSession } from "@/modules/view-data";\nimport { skinViews } from "@/modules/skin-views";\n\nconst View = skinViews["shared.dashboard-layout"];\n\nexport default async function DashboardLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {\n  const { locale } = await params;\n  const session = await getWorkspaceSession();\n  if (!session?.user) redirect({ href: "/sign-in", locale });\n  return <View mode="workspace">{children}</View>;\n}\n`
  );
  await writeText(
    resolve(target, "src", "features", "support", "server.ts"),
    `export { getSupportDetailViewData, getSupportListViewData } from "@/modules/view-data";\n`
  );
  await writeText(
    resolve(target, "src", "middleware.ts"),
    `import type { NextRequest } from "next/server";\nimport createIntlMiddleware from "next-intl/middleware";\n\nimport { routing } from "@/i18n/routing";\n\nconst intlMiddleware = createIntlMiddleware(routing);\n\nexport function middleware(request: NextRequest) {\n  return intlMiddleware(request);\n}\n\nexport const config = {\n  matcher: [\n    "/((?!_next/static|_next/image|favicon.ico|sitemap\\\\.xml|robots\\\\.txt|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",\n  ],\n};\n`
  );
}

export async function writeDemoPageFacade(target: string): Promise<void> {
  const source = [
    'import { DemoDashboardView, DemoSettingsView, DemoSupportDetailPage, DemoSupportListView } from "@/core/skin/demo/pages";',
    'import type { SupportDetailPageInput } from "@/core/support/contracts";',
    "",
    "export function DashboardPage({ locale }: { locale: string }) { return <DemoDashboardView locale={locale} />; }",
    "export function SettingsPage({ locale }: { locale: string }) { void locale; return <DemoSettingsView />; }",
    "export function SupportListPage({ locale }: { locale: string }) { return <DemoSupportListView locale={locale} />; }",
    "export function SupportDetailPage(input: SupportDetailPageInput) { return <DemoSupportDetailPage {...input} />; }",
    "",
  ].join("\n");
  await writeText(resolve(target, "src", "modules", "view-pages.tsx"), source);
}

export async function writeDemoSkinViewsFromManifest(
  target: string,
  catalog: RecipeCatalog,
  viewEntries: Readonly<Record<string, string>>
): Promise<void> {
  await writeDemoSkinViews(target, catalog, viewEntries);
}
