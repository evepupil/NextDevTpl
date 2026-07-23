import { readdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { findGeneratorAssets, loadCatalog } from "./catalog.js";
import {
  copyTemplate,
  installDependencies,
  prepareTarget,
  removePath,
  runPackageScript,
  writeJson,
  writeText,
} from "./filesystem.js";
import { createProjectSelection } from "./selection.js";
import {
  adapterExports,
  serviceExportNames,
  serviceSources,
} from "./service-templates.js";
import type {
  GeneratedProjectManifest,
  GeneratorOptions,
  ProjectSelection,
  RecipeCatalog,
  ServiceKind,
} from "./types.js";

const SERVICE_KINDS: readonly ServiceKind[] = [
  "payment",
  "storage",
  "mail",
  "ai",
  "jobs",
  "rate-limit",
];

const ENV_DEFAULTS: Readonly<Record<string, string>> = {
  APP_VERSION: "local",
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/nextdevtpl",
  BETTER_AUTH_SECRET: "replace-with-a-long-random-secret",
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: "NextDevTpl",
  PORT: "3000",
  POSTGRES_DB: "nextdevtpl",
  POSTGRES_PASSWORD: "replace-with-a-long-random-password",
  POSTGRES_USER: "nextdevtpl",
};

function hasModule(selection: ProjectSelection, id: string): boolean {
  return selection.modules.includes(id);
}

async function pruneModules(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog
): Promise<void> {
  for (const id of selection.excludedModules) {
    await removePath(join(target, "src", "features", id));
    for (const route of catalog.modules[id]?.routes ?? []) {
      await removePath(dirname(join(target, ...route.split("/"))));
    }
  }

  if (!hasModule(selection, "admin")) {
    await removePath(join(target, "src", "app", "[locale]", "(admin)"));
  }
  if (!hasModule(selection, "marketing")) {
    await removePath(join(target, "src", "app", "[locale]", "(marketing)"));
    await removePath(join(target, "src", "app", "[locale]", "docs"));
    await removePath(join(target, "src", "app", "api", "search"));
    await removePath(join(target, "src", "lib", "source.ts"));
    await removePath(join(target, "src", "types", "fumadocs-source.d.ts"));
    await removePath(join(target, "source.config.ts"));
    await removePath(join(target, "src", "content"));
    await writeText(
      join(target, "next.config.mjs"),
      `import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@neondatabase/serverless",
    "pino",
    "pino-pretty",
    "ws",
  ],
};

export default withNextIntl(nextConfig);
`
    );
  }
  if (selection.adapters.jobs !== "jobs:inngest") {
    await removePath(join(target, "src", "app", "api", "inngest"));
  }
  if (!selection.adapters.ai) {
    await removePath(join(target, "src", "lib", "ai"));
  }

  if (!hasModule(selection, "payment")) {
    await removePath(join(target, "src", "config", "payment.ts"));
  }
  if (!hasModule(selection, "subscription")) {
    await removePath(join(target, "src", "config", "subscription-plan.ts"));
  }
  const paymentExports = hasModule(selection, "payment")
    ? `export { findPlanByPriceId, getBaseUrl, getPlanPrice, getPricingConfig, getPricingPlans, PRICE_IDS, paymentConfig } from "./payment";\n`
    : "";
  await writeText(
    join(target, "src", "config", "index.ts"),
    `export { adminConfig, adminNav, dashboardConfig, dashboardNav, footerNav, mainNav, marketingConfig, type NavGroup, type NavItem, type ProductNavGroup, type ProductNavItem, productsNav } from "./nav";\n${paymentExports}export { type SiteConfig, siteConfig } from "./site";\n`
  );
}

async function rewriteAdapters(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog
): Promise<void> {
  const selectedIds = new Set(Object.values(selection.adapters));
  const selectedSources = new Set(
    [...selectedIds].map((id) => catalog.adapters[id]?.source)
  );
  selectedSources.add("src/adapters/rate-limit/noop.ts");

  for (const adapter of Object.values(catalog.adapters)) {
    if (!selectedSources.has(adapter.source)) {
      await removePath(join(target, ...adapter.source.split("/")));
    }
  }

  for (const kind of SERVICE_KINDS) {
    const id = selection.adapters[kind];
    const family = join(target, "src", "adapters", kind);
    if (!id) {
      await removePath(family);
      continue;
    }
    let exports = adapterExports[id];
    if (!exports) throw new Error(`Missing adapter export template: ${id}`);
    if (kind === "rate-limit" && id !== "rate-limit:noop") {
      exports += adapterExports["rate-limit:noop"];
    }
    await writeText(join(family, "index.ts"), exports);
  }

  const manifests = [...selectedIds].map((id) => {
    const item = catalog.adapters[id];
    if (!item) throw new Error(`Unknown selected adapter: ${id}`);
    return { id, ...item };
  });
  const registrySource = `import { defineServiceAdapter, type ServiceAdapterManifest, validateServiceAdapterManifests } from "@/core/services";

const manifests = ${JSON.stringify(manifests, null, 2)} as const satisfies readonly ServiceAdapterManifest[];
export const serviceAdapterRegistry = manifests.map((manifest) => defineServiceAdapter(manifest));
const errors = validateServiceAdapterManifests(serviceAdapterRegistry);
if (errors.length > 0) throw new Error(\`Service adapter registry is invalid:\\n\${errors.join("\\n")}\`);

export const defaultServiceAdapters = ${JSON.stringify(selection.adapters, null, 2)} as const;
export type ServiceAdapterId = (typeof serviceAdapterRegistry)[number]["id"];
`;
  await writeText(
    join(target, "src", "adapters", "registry.ts"),
    registrySource
  );
  await writeText(
    join(target, "src", "adapters", "index.ts"),
    `export { defaultServiceAdapters, serviceAdapterRegistry } from "./registry";\nexport type { ServiceAdapterId } from "./registry";\n`
  );
}

async function rewriteServices(
  target: string,
  selection: ProjectSelection
): Promise<void> {
  let index = "";
  for (const kind of SERVICE_KINDS) {
    const id = selection.adapters[kind];
    const path = join(target, "src", "services", `${kind}.ts`);
    if (!id) {
      await removePath(path);
      continue;
    }
    const source = serviceSources[id];
    if (!source) throw new Error(`Missing service template: ${id}`);
    await writeText(path, source);
    index += serviceExportNames[kind];
  }
  await writeText(join(target, "src", "services", "index.ts"), index);
}

async function rewriteModuleRegistry(
  target: string,
  selection: ProjectSelection
): Promise<void> {
  const imports = selection.modules
    .map(
      (id) =>
        `import { ${id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}Module } from "@/features/${id}/manifest";`
    )
    .join("\n");
  const entries = selection.modules
    .map(
      (id) =>
        `  ${id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}Module,`
    )
    .join("\n");
  await writeText(
    join(target, "src", "modules", "registry.ts"),
    `import { createModuleRegistry } from "@/core/modules";\n${imports}\n\nexport const moduleRegistry = createModuleRegistry([\n${entries}\n]);\n`
  );
  await writeText(
    join(target, "src", "modules", "presets.ts"),
    `import type { ModuleId } from "@/core/modules";\n\nexport const modulePresets = {\n  generated: ${JSON.stringify(selection.modules)},\n} as const satisfies Record<string, readonly ModuleId[]>;\n\nexport type ModulePresetName = keyof typeof modulePresets;\n`
  );
}

async function rewriteSchema(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog
): Promise<void> {
  const groups = [
    ...new Set(
      selection.modules.flatMap((id) => catalog.modules[id]?.schema ?? [])
    ),
  ];
  await writeText(
    join(target, "src", "db", "schema", "index.ts"),
    `${groups.map((group) => `export * from "./${group}";`).join("\n")}\n`
  );
  const selected = new Set(groups);
  for (const file of await readdir(join(target, "src", "db", "schema"))) {
    const group = file.replace(/\.ts$/, "");
    if (group !== "index" && !selected.has(group)) {
      await removePath(join(target, "src", "db", "schema", file));
    }
  }
}

async function rewriteTranslations(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog
): Promise<void> {
  const namespaces = new Set(
    selection.modules.flatMap((id) => catalog.modules[id]?.translations ?? [])
  );
  for (const locale of ["en", "zh"] as const) {
    const path = join(target, "messages", `${locale}.json`);
    const current = JSON.parse(await readFile(path, "utf8")) as Record<
      string,
      unknown
    >;
    await writeJson(
      path,
      Object.fromEntries(
        Object.entries(current).filter(([key]) => namespaces.has(key))
      )
    );
  }
}

function localeLayout(selection: ProjectSelection): string {
  const analyticsImport = hasModule(selection, "analytics")
    ? 'import { Analytics } from "@/features/analytics";\n'
    : "";
  const marketingImport = hasModule(selection, "marketing")
    ? 'import { CookieConsent } from "@/features/marketing";\n'
    : "";
  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { siteConfig } from "@/config";
${analyticsImport}${marketingImport}import { Providers } from "@/features/shared";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = siteConfig.url;
  return { alternates: { canonical: \`\${baseUrl}/\${locale}\`, languages: { en: \`\${baseUrl}/en\`, zh: \`\${baseUrl}/zh\`, "x-default": \`\${baseUrl}/en\` } } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "zh")) notFound();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <Providers locale={locale}>
        {children}
        ${hasModule(selection, "marketing") ? "<CookieConsent />" : ""}
        <Toaster richColors position="top-right" />
        ${hasModule(selection, "analytics") ? "<Analytics />" : ""}
      </Providers>
    </NextIntlClientProvider>
  );
}
`;
}

function dashboardLayout(selection: ProjectSelection): string {
  const creditsImport = hasModule(selection, "credits")
    ? 'import { CreditBalanceBadge } from "@/features/credits";\n'
    : "";
  const subscriptionImport = hasModule(selection, "subscription")
    ? 'import { CurrentPlanBadge } from "@/features/subscription";\n'
    : "";
  const props = [
    hasModule(selection, "credits")
      ? "compactAccountBadge={<CreditBalanceBadge />}"
      : "",
    hasModule(selection, "subscription")
      ? "accountPlanBadge={<CurrentPlanBadge />}"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `import { redirect } from "next/navigation";
${creditsImport}import { DashboardMainWrapper, DashboardSidebar, SidebarProvider } from "@/features/dashboard";
${subscriptionImport}import { getServerSession } from "@/lib/auth/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/sign-in");
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/40">
        <DashboardSidebar ${props} />
        <DashboardMainWrapper>{children}</DashboardMainWrapper>
      </div>
    </SidebarProvider>
  );
}
`;
}

const BASIC_DASHBOARD = `import { getTranslations } from "next-intl/server";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DashboardPages.dashboard" });
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
`;

function sitemapSource(selection: ProjectSelection): string {
  const imports = [
    'import type { MetadataRoute } from "next";',
    'import { siteConfig } from "@/config";',
    hasModule(selection, "pseo")
      ? 'import { getAllPseoParams } from "@/features/pseo";'
      : "",
    hasModule(selection, "blog") || hasModule(selection, "marketing")
      ? `import { ${[
          hasModule(selection, "blog") ? "getAllBlogSlugs" : "",
          hasModule(selection, "marketing") ? "getAllLegalSlugs" : "",
        ]
          .filter(Boolean)
          .join(", ")} } from "@/lib/source";`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const staticPaths = [
    hasModule(selection, "marketing") ? "" : undefined,
    hasModule(selection, "blog") ? "/blog" : undefined,
    hasModule(selection, "pseo") ? "/pseo" : undefined,
  ].filter((value): value is string => value !== undefined);
  const dynamic = [
    hasModule(selection, "blog")
      ? `  for (const { locale, slug } of getAllBlogSlugs()) routes.push({ url: \`\${baseUrl}/\${locale}/blog/\${slug}\`, lastModified: now });`
      : "",
    hasModule(selection, "marketing")
      ? `  for (const { locale, slug } of getAllLegalSlugs()) routes.push({ url: \`\${baseUrl}/\${locale}/legal/\${slug}\`, lastModified: now });`
      : "",
    hasModule(selection, "pseo")
      ? `  for (const { locale, slug } of getAllPseoParams()) routes.push({ url: \`\${baseUrl}/\${locale}/pseo/\${slug}\`, lastModified: now });`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `${imports}

const locales = ["en", "zh"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of ${JSON.stringify(staticPaths)}) {
      routes.push({ url: \`\${baseUrl}/\${locale}\${path}\`, lastModified: now });
    }
  }
${dynamic}
  return routes;
}
`;
}

async function rewriteComposition(
  target: string,
  selection: ProjectSelection
): Promise<void> {
  await writeText(
    join(target, "src", "app", "[locale]", "layout.tsx"),
    localeLayout(selection)
  );
  await writeText(
    join(target, "src", "app", "[locale]", "(dashboard)", "layout.tsx"),
    dashboardLayout(selection)
  );
  if (!hasModule(selection, "credits")) {
    await writeText(
      join(
        target,
        "src",
        "app",
        "[locale]",
        "(dashboard)",
        "dashboard",
        "page.tsx"
      ),
      BASIC_DASHBOARD
    );
  }
  await writeText(
    join(target, "src", "app", "sitemap.ts"),
    sitemapSource(selection)
  );
}

async function rewriteEnvironment(
  target: string,
  selection: ProjectSelection
): Promise<void> {
  const keys = [
    "APP_VERSION",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_APP_NAME",
    ...selection.env,
    ...(selection.target === "docker"
      ? ["PORT", "POSTGRES_DB", "POSTGRES_PASSWORD", "POSTGRES_USER"]
      : selection.target === "server"
        ? ["PORT"]
        : []),
  ];
  const unique = [...new Set(keys)].sort();
  await writeText(
    join(target, ".env.example"),
    `# Generated for the ${selection.preset} preset (${selection.target}).\n${unique
      .map((key) => `${key}=${ENV_DEFAULTS[key] ?? ""}`)
      .join("\n")}\n`
  );
}

async function rewriteDeployment(
  target: string,
  selection: ProjectSelection
): Promise<void> {
  const removeDocker = async () => {
    await removePath(join(target, ".dockerignore"));
    await removePath(join(target, "compose.yaml"));
    await removePath(join(target, "Dockerfile"));
    await removePath(join(target, "deploy", "docker"));
  };
  const removeServer = async () => {
    await removePath(join(target, "deploy", "server"));
  };
  const removeVercel = async () => {
    await removePath(join(target, "deploy", "vercel"));
    await removePath(join(target, "vercel.json"));
  };

  if (selection.target === "docker") {
    await removeServer();
    await removeVercel();
    return;
  }
  if (selection.target === "server") {
    await removeDocker();
    await removeVercel();
    return;
  }
  if (selection.target === "vercel") {
    await removeDocker();
    await removeServer();
    const vercelConfig = {
      $schema: "https://openapi.vercel.sh/vercel.json",
      framework: "nextjs",
      buildCommand: "pnpm build",
      ...(hasModule(selection, "credits")
        ? {
            crons: [
              {
                path: "/api/jobs/credits/expire",
                schedule: "0 0 * * *",
              },
            ],
          }
        : {}),
    };
    await writeJson(join(target, "vercel.json"), vercelConfig);
    return;
  }

  await removePath(join(target, "deploy"));
  await removeDocker();
  await removeVercel();
}

async function rewritePackage(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog
): Promise<void> {
  const path = join(target, "package.json");
  const packageJson = JSON.parse(await readFile(path, "utf8")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    name: string;
    private: boolean;
    scripts: Record<string, string>;
  };
  const allAdapterPackages = new Set(
    Object.values(catalog.adapters).flatMap((adapter) => adapter.packages)
  );
  const selectedPackages = new Set(selection.packages);
  for (const dependency of allAdapterPackages) {
    if (!selectedPackages.has(dependency))
      delete packageJson.dependencies[dependency];
  }
  if (!hasModule(selection, "analytics")) {
    delete packageJson.dependencies["@next/third-parties"];
  }
  if (!hasModule(selection, "marketing")) {
    delete packageJson.dependencies["fumadocs-core"];
    delete packageJson.dependencies["fumadocs-mdx"];
    delete packageJson.scripts.postinstall;
  } else {
    packageJson.scripts.postinstall = "fumadocs-mdx";
  }
  packageJson.name =
    basename(target)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "nextdevtpl-app";
  packageJson.private = true;
  delete packageJson.scripts["verify:generated"];
  delete packageJson.scripts["deploy:check"];
  delete packageJson.scripts["deploy:server:build"];
  delete packageJson.scripts["verify:health"];
  packageJson.scripts["db:generate:init"] = "drizzle-kit generate --name init";
  if (selection.target !== "cloudflare") {
    packageJson.scripts["deploy:check"] = "node deploy/check-health.mjs";
    packageJson.scripts["verify:health"] =
      "node deploy/verify-production-health.mjs";
  }
  if (selection.target === "server") {
    packageJson.scripts["deploy:server:build"] = "bash deploy/server/build.sh";
  }
  await writeJson(path, packageJson);
}

async function writeSmokeTest(
  target: string,
  manifest: GeneratedProjectManifest
): Promise<void> {
  await removePath(join(target, "src", "test"));
  await writeText(
    join(target, "src", "test", "generated.test.ts"),
    `import { describe, expect, it } from "vitest";\nimport manifest from "../../nextdevtpl.generated.json";\n\ndescribe("generated project", () => {\n  it("records a stable selection", () => {\n    expect(manifest.modules).toEqual(${JSON.stringify(manifest.modules)});\n    expect(manifest.target).toBe(${JSON.stringify(manifest.target)});\n  });\n});\n`
  );
  await writeText(
    join(target, "vitest.config.ts"),
    `import { defineConfig } from "vitest/config";\n\nexport default defineConfig({ test: { environment: "node", include: ["src/test/**/*.test.ts"] } });\n`
  );
}

export async function generateProject(
  options: GeneratorOptions
): Promise<{ manifest: GeneratedProjectManifest; targetDirectory: string }> {
  const discovered = await findGeneratorAssets();
  const assets = {
    catalogPath: options.catalogPath ?? discovered.catalogPath,
    templateManifestPath:
      options.templateManifestPath ?? discovered.templateManifestPath,
    templateRoot: options.templateRoot ?? discovered.templateRoot,
  };
  const catalog = await loadCatalog(assets.catalogPath);
  const selection = createProjectSelection(catalog, options);
  const target = await prepareTarget(options.targetDirectory);

  try {
    await copyTemplate(
      assets.templateRoot,
      assets.templateManifestPath,
      target.path
    );
    await removePath(join(target.path, "drizzle"));
    await pruneModules(target.path, selection, catalog);
    await rewriteAdapters(target.path, selection, catalog);
    await rewriteServices(target.path, selection);
    await rewriteModuleRegistry(target.path, selection);
    await rewriteSchema(target.path, selection, catalog);
    await rewriteTranslations(target.path, selection, catalog);
    await rewriteComposition(target.path, selection);
    await rewriteEnvironment(target.path, selection);
    await rewriteDeployment(target.path, selection);
    await rewritePackage(target.path, selection, catalog);

    const manifest: GeneratedProjectManifest = {
      catalogVersion: catalog.version,
      preset: selection.preset,
      target: selection.target,
      modules: selection.modules,
      adapters: selection.adapters,
      bindings: selection.bindings,
    };
    await writeJson(join(target.path, "nextdevtpl.generated.json"), manifest);
    await writeSmokeTest(target.path, manifest);
    if (options.install !== false) {
      const packageManager = options.packageManager ?? "pnpm";
      await installDependencies(target.path, packageManager);
      await runPackageScript(target.path, packageManager, "db:generate:init");
    }
    return { manifest, targetDirectory: target.path };
  } catch (error) {
    if (target.created) await rm(target.path, { recursive: true, force: true });
    throw error;
  }
}
