import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { parse, stringify } from "yaml";

import { findGeneratorAssets, loadCatalog } from "./catalog.js";
import { validateDemoClientViews } from "./demo-client-validation.js";
import {
  pruneDemoBackendFiles,
  rewriteDemoProjectConfig,
  writeDemoPageFacade,
  writeDemoRuntime,
  writeDemoSkinViewsFromManifest,
} from "./demo-composition.js";
import {
  DEMO_VIEW_MODULES,
  prepareDemoData,
  validateDemoOptions,
  writeDemoAvatarAssets,
  writePreparedDemoData,
} from "./demo-generation.js";
import { collectSourcePackageImports } from "./dependency-analysis.js";
import {
  copyTemplate,
  createGenerationStage,
  deliverStage,
  installDependencies,
  prepareTarget,
  removePath,
  runPackageScript,
  updateLockfileOnly,
  writeJson,
  writeText,
} from "./filesystem.js";
import { GeneratorError } from "./generator-error.js";
import type { GeneratorTestHooks } from "./generator-internals.js";
import { pruneRepositoryOnlyPackageEntries } from "./package-pruning.js";
import {
  applyPaletteToTokensCss,
  loadPaletteSelection,
} from "./palettes/index.js";
import type { LoadedPalette } from "./palettes/types.js";
import { pruneUnselectedRoutes } from "./route-pruning.js";
import { createProjectSelection } from "./selection.js";
import {
  adapterExports,
  serviceExportNames,
  serviceSources,
} from "./service-templates.js";
import {
  applySkinPackage,
  refreshSkinFileHashes,
  validateSkinPackage,
} from "./skins/index.js";
import { resolveSkinSource } from "./skins/source.js";
import {
  sanitizeSkinError,
  skinProcessEnvironment,
} from "./skins/source-env.js";
import type {
  GeneratedSkinRecord,
  SkinSourceSelection,
} from "./skins/source-types.js";
import { runInTargetTransaction } from "./target-transaction.js";
import type {
  GeneratedProjectManifest,
  GeneratorOptions,
  ProjectSelection,
  RecipeCatalog,
  ServiceKind,
} from "./types.js";
import {
  pruneUnselectedSkinSources,
  writeSelectedSkinViews,
} from "./view-composition.js";
import { writeWorkspaceComposition } from "./workspace-composition.js";

const SERVICE_KINDS: readonly ServiceKind[] = [
  "payment",
  "storage",
  "mail",
  "ai",
  "alerts",
  "analytics",
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

const CLOUDFLARE_RATE_LIMIT_NAMESPACE_BUCKETS = 200_000_000;
const CLOUDFLARE_RATE_LIMIT_NAMESPACE_STRIDE = 10;

const CLOUDFLARE_RATE_LIMITS = [
  { limit: 100, name: "RATE_LIMIT_GLOBAL", slot: 1 },
  { limit: 5, name: "RATE_LIMIT_AUTH", slot: 2 },
  { limit: 20, name: "RATE_LIMIT_AI", slot: 3 },
  { limit: 10, name: "RATE_LIMIT_PAYMENT", slot: 4 },
  { limit: 30, name: "RATE_LIMIT_UPLOAD", slot: 5 },
  { limit: 3, name: "RATE_LIMIT_STRICT", slot: 6 },
  { limit: 60, name: "RATE_LIMIT_TELEMETRY", slot: 7 },
] as const;

function projectName(target: string): string {
  return (
    basename(target)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "nextdevtpl-app"
  );
}

function cloudflareRateLimitNamespaceBase(project: string): number {
  const digest = createHash("sha256")
    .update(`nextdevtpl:cloudflare-rate-limit:${project}`)
    .digest();
  return digest.readUInt32BE(0) % CLOUDFLARE_RATE_LIMIT_NAMESPACE_BUCKETS;
}

function cloudflareRateLimitNamespaceId(base: number, slot: number): string {
  return String(base * CLOUDFLARE_RATE_LIMIT_NAMESPACE_STRIDE + slot);
}

function cloudflareCompatibilityDate(): string {
  const today = new Date().toISOString().slice(0, 10);
  const override = process.env.CF_COMPATIBILITY_DATE?.trim();
  if (!override) return today;
  const parsed = /^\d{4}-\d{2}-\d{2}$/u.test(override)
    ? new Date(`${override}T00:00:00.000Z`)
    : null;
  const isValidDate =
    parsed !== null &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === override;
  if (!isValidDate || override > today) {
    throw new GeneratorError(
      `CF_COMPATIBILITY_DATE must be an existing UTC date no later than ${today}`
    );
  }
  return override;
}

function cloudflareDatabaseSource(): string {
  return `import { neon, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNeonServerless } from "drizzle-orm/neon-serverless";

import { getRuntimeEnv } from "@/lib/runtime-config";

import * as schema from "./schema/index";

type HttpDatabase = ReturnType<typeof createDatabaseConnection>;

function createTransactionDatabase(pool: NeonPool) {
  return drizzleNeonServerless(pool, { schema });
}

type TransactionDatabase = ReturnType<typeof createTransactionDatabase>;
export type DatabaseTransaction = Parameters<
  Parameters<TransactionDatabase["transaction"]>[0]
>[0];
type TransactionConfig = Parameters<TransactionDatabase["transaction"]>[1];
type Database = Omit<HttpDatabase, "transaction"> &
  Pick<TransactionDatabase, "transaction">;

function createDatabaseConnection(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzleNeonHttp(sql, { schema });
}

let database: HttpDatabase | undefined;

function getDatabase(): HttpDatabase {
  if (database) return database;

  const databaseUrl = getRuntimeEnv("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  database = createDatabaseConnection(databaseUrl);
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    if (property === "transaction") return withDbTransaction;

    const databaseInstance = getDatabase();
    const value = Reflect.get(databaseInstance, property);
    return typeof value === "function" ? value.bind(databaseInstance) : value;
  },
});

export async function withDbTransaction<T>(
  callback: (tx: DatabaseTransaction) => Promise<T>,
  config?: TransactionConfig
): Promise<T> {
  const databaseUrl = getRuntimeEnv("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const pool = new NeonPool({ connectionString: databaseUrl });
  try {
    const transactionDb = createTransactionDatabase(pool);
    return await transactionDb.transaction(callback, config);
  } finally {
    await pool.end();
  }
}

export * from "./schema/index";
`;
}

function cloudflareMonitoringSource(): string {
  return `export type SeverityLevel = "debug" | "error" | "fatal" | "info" | "log" | "warning";

export function isSentryEnabled(): boolean {
  return false;
}

export function initSentryServer(): void {}
export function initSentryClient(): void {}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error("[Error]", error, context);
}

export function captureMessage(
  message: string,
  level: SeverityLevel = "info",
  context?: Record<string, unknown>
): void {
  let log = console.log;
  if (level === "error" || level === "fatal") log = console.error;
  if (level === "warning") log = console.warn;
  log(\`[\${level}]\`, message, context);
}

export function setUser(_user: { id: string; email?: string; username?: string } | null): void {}
export function clearUser(): void {}
export function setTag(_key: string, _value: string): void {}
export function setContext(_name: string, _context: Record<string, unknown>): void {}

export function startSpan(
  _operation: string,
  _description?: string
): undefined {
  return undefined;
}

export async function withSpan<T>(
  _operation: string,
  _description: string,
  fn: () => Promise<T>
): Promise<T> {
  return fn();
}

export function withSentryAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput) => {
    try {
      return await action(input);
    } catch (error) {
      captureError(error, { action: action.name });
      throw error;
    }
  };
}

export function withSentryHandler<T extends Response>(
  handler: (request: Request) => Promise<T>
): (request: Request) => Promise<T | Response> {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      captureError(error, { method: request.method, path: new URL(request.url).pathname });
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
`;
}

function cloudflareConfig(
  target: string,
  selection: ProjectSelection
): Record<string, unknown> {
  const name = projectName(target);
  const namespaceBase = cloudflareRateLimitNamespaceBase(name);
  const bindings = new Set(selection.bindings);
  return {
    $schema: "node_modules/wrangler/config-schema.json",
    name,
    main: "cloudflare/worker.mjs",
    compatibility_date: cloudflareCompatibilityDate(),
    compatibility_flags: [
      "nodejs_compat",
      "nodejs_compat_populate_process_env",
      "global_fetch_strictly_public",
    ],
    minify: true,
    assets: { directory: ".open-next/assets", binding: "ASSETS" },
    services: [{ binding: "WORKER_SELF_REFERENCE", service: name }],
    observability: {
      enabled: true,
      logs: {
        enabled: true,
        head_sampling_rate: 1,
        invocation_logs: true,
      },
      traces: { enabled: true, head_sampling_rate: 0.1 },
    },
    ...(bindings.has("R2Bucket")
      ? { r2_buckets: [{ binding: "NEXTDEVTPL_STORAGE" }] }
      : {}),
    ...(bindings.has("Ai") ? { ai: { binding: "AI" } } : {}),
    ...(bindings.has("Workflow")
      ? {
          workflows: [
            {
              binding: "NEXTDEVTPL_WORKFLOW",
              name: `${name}-jobs`,
              class_name: "NextDevTplWorkflow",
            },
          ],
        }
      : {}),
    ...(bindings.has("SendEmail")
      ? { send_email: [{ name: "NEXTDEVTPL_EMAIL" }] }
      : {}),
    ...(bindings.has("RateLimit")
      ? {
          ratelimits: CLOUDFLARE_RATE_LIMITS.map((item) => ({
            name: item.name,
            namespace_id: cloudflareRateLimitNamespaceId(
              namespaceBase,
              item.slot
            ),
            simple: { limit: item.limit, period: 60 },
          })),
        }
      : {}),
  };
}

function cloudflarePreflightConfig(
  target: string,
  selection: ProjectSelection
): Record<string, unknown> {
  const required = new Set(["NEXT_PUBLIC_APP_URL"]);
  const remoteRequired = new Set<string>();
  const groups: { label: string; names: string[] }[] = [];
  const remoteGroups: { label: string; names: string[] }[] = [];
  const addRequired = (...names: string[]) => {
    for (const name of names) required.add(name);
  };
  const addRemoteRequired = (...names: string[]) => {
    for (const name of names) {
      required.add(name);
      remoteRequired.add(name);
    }
  };
  const addGroup = (label: string, ...names: string[]) => {
    groups.push({ label, names });
  };
  const addRemoteGroup = (label: string, ...names: string[]) => {
    addGroup(label, ...names);
    remoteGroups.push({ label, names });
  };

  const needsDatabase = [
    "auth",
    "credits",
    "payment",
    "subscription",
    "support",
  ].some((module) => selection.modules.includes(module));
  if (needsDatabase) addRemoteRequired("DATABASE_URL");
  if (selection.modules.includes("auth")) {
    addRequired("BETTER_AUTH_SECRET", "BETTER_AUTH_URL");
    remoteRequired.add("BETTER_AUTH_SECRET");
  }

  if (selection.modules.includes("storage")) {
    addRequired("STORAGE_BUCKET_NAME", "NEXT_PUBLIC_AVATARS_BUCKET_NAME");
  }
  if (
    selection.modules.includes("credits") ||
    selection.modules.includes("operations")
  ) {
    addRemoteRequired("CRON_SECRET");
  }

  for (const adapter of Object.values(selection.adapters)) {
    switch (adapter) {
      case "payment:creem":
        addRemoteRequired("CREEM_API_KEY", "CREEM_WEBHOOK_SECRET");
        break;
      case "payment:stripe":
        addRemoteRequired("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
        break;
      case "storage:s3-compatible":
        addRemoteRequired("STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY");
        addRequired("STORAGE_ENDPOINT", "STORAGE_REGION");
        break;
      case "mail:resend":
        addRemoteRequired("RESEND_API_KEY");
        addRequired("EMAIL_FROM");
        break;
      case "mail:smtp":
        addRequired("SMTP_HOST", "SMTP_PORT", "SMTP_SECURE");
        addRemoteRequired("SMTP_USER", "SMTP_PASS");
        break;
      case "mail:cloudflare-email":
        addRequired("EMAIL_FROM");
        break;
      case "ai:openai-compatible":
        addRequired("AI_PROVIDER");
        addRemoteGroup(
          "OpenAI-compatible provider key",
          "OPENAI_API_KEY",
          "DEEPSEEK_API_KEY",
          "MIMO_API_KEY"
        );
        break;
      case "ai:anthropic":
        addRemoteRequired("ANTHROPIC_API_KEY");
        break;
      case "ai:workers-ai":
        addRequired("WORKERS_AI_MODEL");
        break;
      case "jobs:inngest":
        addRemoteRequired("INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY");
        break;
      case "rate-limit:upstash":
        addRequired("UPSTASH_REDIS_REST_URL");
        addRemoteRequired("UPSTASH_REDIS_REST_TOKEN");
        break;
      default:
        break;
    }
  }

  return {
    required: [...required].sort(),
    groups,
    remoteRequired: [...remoteRequired].sort(),
    remoteGroups,
    optionalPairs: [
      ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    ],
    oauthCallback: selection.modules.includes("auth"),
    workerName: projectName(target),
  };
}

async function rewriteCloudflareRuntime(
  target: string,
  selection: ProjectSelection
): Promise<void> {
  const templateRoot = join(target, "cloudflare", "templates", "mail");
  const loggerTemplate = join(target, "cloudflare", "templates", "logger.ts");
  const mailRoot = join(target, "src", "features", "mail");

  await writeText(
    join(target, "src", "lib", "logger", "index.ts"),
    await readFile(loggerTemplate, "utf8")
  );

  if (hasModule(selection, "mail")) {
    await removePath(join(mailRoot, "templates"));
    await writeText(
      join(mailRoot, "templates", "index.ts"),
      await readFile(join(templateRoot, "templates.ts"), "utf8")
    );
    await writeText(
      join(mailRoot, "utils.ts"),
      await readFile(join(templateRoot, "utils.ts"), "utf8")
    );
    await writeText(
      join(mailRoot, "server.ts"),
      await readFile(join(templateRoot, "server.ts"), "utf8")
    );
    await writeText(
      join(mailRoot, "index.ts"),
      `export * from "./actions";\nexport { mailModule } from "./manifest";\nexport * from "./templates";\nexport * from "./utils";\n`
    );
  }

  if (hasModule(selection, "auth")) {
    const authPath = join(target, "src", "lib", "auth", "index.ts");
    const authSource = await readFile(authPath, "utf8");
    const workerAuthSource = authSource
      .replace("ResetPasswordEmail,", "createResetPasswordEmail,")
      .replace("VerifyEmailEmail,", "createVerifyEmail,")
      .replace(
        "react: ResetPasswordEmail({",
        "content: createResetPasswordEmail({"
      )
      .replace("react: VerifyEmailEmail({", "content: createVerifyEmail({");
    if (
      workerAuthSource === authSource ||
      workerAuthSource.includes("react:")
    ) {
      throw new Error(
        "Cloudflare mail rewrite no longer matches the auth source"
      );
    }
    await writeText(authPath, workerAuthSource);
  }

  await removePath(
    join(target, "src", "app", "[locale]", "opengraph-image.tsx")
  );
  await removePath(join(target, "src", "app", "[locale]", "twitter-image.tsx"));
  await removePath(join(target, "cloudflare", "templates"));
}

function hasModule(selection: ProjectSelection, id: string): boolean {
  return selection.modules.includes(id);
}

const AUTHLESS_MIDDLEWARE = `import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
  getRateLimitHeaders,
  type RateLimitType,
} from "@/lib/rate-limit";

const intlMiddleware = createIntlMiddleware(routing);
const API_RATE_LIMITS: Array<{ pattern: RegExp; type: RateLimitType }> = [
  { pattern: /^\\/api\\/telemetry$/, type: "telemetry" },
  { pattern: /^\\/api\\/upload/, type: "upload" },
];

function getApiRateLimitType(pathname: string): RateLimitType | null {
  for (const { pattern, type } of API_RATE_LIMITS) {
    if (pattern.test(pathname)) return type;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/health" || pathname.startsWith("/api/webhooks/")) {
      return NextResponse.next();
    }
    const rateLimitType = getApiRateLimitType(pathname);
    if (!rateLimitType) return NextResponse.next();

    const result = await checkRateLimit(getClientIp(request), rateLimitType);
    if (!result.success) return createRateLimitResponse(result);

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(getRateLimitHeaders(result))) {
      response.headers.set(key, value);
    }
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
`;

async function pruneModules(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog
): Promise<void> {
  await removePath(join(target, "src", "components", "motion", "reveal.tsx"));
  await pruneUnselectedSkinSources(target, selection.modules, catalog);
  await pruneUnselectedRoutes(target, selection.modules, catalog);
  for (const id of selection.excludedModules) {
    await removePath(join(target, "src", "features", id));
  }
  if (!hasModule(selection, "auth")) {
    await removePath(join(target, "src", "app", "[locale]", "(auth)"));
    await removePath(join(target, "src", "app", "api", "auth"));
    await removePath(join(target, "src", "lib", "auth"));
    await removePath(join(target, "src", "lib", "safe-action.ts"));
    await removePath(join(target, "src", "config", "auth-navigation.ts"));
    await writeText(join(target, "src", "middleware.ts"), AUTHLESS_MIDDLEWARE);
  }
  if (!hasModule(selection, "marketing")) {
    await removePath(join(target, "src", "app", "[locale]", "(marketing)"));
    await removePath(join(target, "src", "app", "[locale]", "docs"));
    await removePath(
      join(target, "src", "app", "[locale]", "opengraph-image.tsx")
    );
    await removePath(
      join(target, "src", "app", "[locale]", "twitter-image.tsx")
    );
    await removePath(join(target, "src", "app", "api", "search"));
    await removePath(join(target, "src", "lib", "source.ts"));
    await removePath(join(target, "src", "types", "fumadocs-source.d.ts"));
    await removePath(join(target, "source.config.ts"));
    await removePath(join(target, "src", "content"));
    await writeText(
      join(target, "next.config.mjs"),
      `import createNextIntlPlugin from "next-intl/plugin";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
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
  if (!hasModule(selection, "operations")) {
    await removePath(join(target, "src", "adapters", "alerts"));
    await removePath(join(target, "src", "services", "alerts.ts"));
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
  if (
    selection.adapters.alerts &&
    selection.adapters.alerts !== "alerts:noop"
  ) {
    selectedSources.add("src/adapters/alerts/noop.ts");
  }

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
    const fileName = kind === "analytics" ? "telemetry" : kind;
    const path = join(target, "src", "services", `${fileName}.ts`);
    if (!id) {
      if (kind === "analytics") {
        const fallback = serviceSources["analytics:none"];
        if (!fallback) throw new Error("Missing analytics fallback template");
        await writeText(path, fallback);
        index += serviceExportNames[kind];
        continue;
      }
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
    groups.length > 0
      ? `${groups.map((group) => `export * from "./${group}";`).join("\n")}\n`
      : "export {};\n"
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
  catalog: RecipeCatalog,
  skinId: string
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
    const retained = Object.fromEntries(
      Object.entries(current).filter(([key]) => namespaces.has(key))
    );
    const skinNamespace = `Skin.${skinId}`;
    const skinMessagePath = join(
      target,
      "src",
      "skin",
      "messages",
      `${locale}.json`
    );
    try {
      if (Object.hasOwn(current, skinNamespace)) {
        throw new Error("Skin messages cannot replace an existing namespace");
      }
      const skinMessages = JSON.parse(
        await readFile(skinMessagePath, "utf8")
      ) as unknown;
      if (!isRecord(skinMessages)) {
        throw new Error("Skin messages must be a JSON object");
      }
      retained[skinNamespace] = skinMessages;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await writeJson(path, retained);
  }
}

function localeLayout(selection: ProjectSelection): string {
  const analyticsImport =
    hasModule(selection, "analytics") &&
    selection.adapters.analytics !== "analytics:noop"
      ? 'import { Analytics } from "@/features/analytics";\n'
      : "";
  const telemetryIdentityImport = analyticsImport
    ? 'import { TelemetryIdentityProvider } from "@/lib/telemetry/identity-provider";\n'
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
${telemetryIdentityImport}

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
    <NextIntlClientProvider key={locale} messages={messages}>
      <Providers locale={locale}>
        {children}
        ${hasModule(selection, "marketing") ? "<CookieConsent />" : ""}
        <Toaster richColors position="top-right" />
        ${analyticsImport ? "<Analytics />" : ""}
        ${telemetryIdentityImport ? "<TelemetryIdentityProvider />" : ""}
      </Providers>
    </NextIntlClientProvider>
  );
}
`;
}

function sitemapSource(selection: ProjectSelection): string {
  const imports = [
    'import type { MetadataRoute } from "next";',
    'import { siteConfig } from "@/config";',
    hasModule(selection, "pseo")
      ? 'import { getAllPseoParams } from "@/features/pseo/server";'
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
    join(target, "src", "app", "sitemap.ts"),
    sitemapSource(selection)
  );
  if (hasModule(selection, "auth")) {
    const afterSignIn = [
      selection.modules.includes("dashboard") ? "/dashboard" : null,
      selection.modules.includes("settings") ? "/dashboard/settings" : null,
      selection.modules.includes("support") ? "/dashboard/support" : null,
      selection.modules.includes("marketing") ? "/" : null,
    ].find((path) => path !== null);
    await writeText(
      join(target, "src", "config", "auth-navigation.ts"),
      `export interface AuthNavigation {\n  afterSignIn: string | null;\n  afterSignOut: string;\n}\n\nexport const authNavigation: AuthNavigation = {\n  afterSignIn: ${JSON.stringify(afterSignIn ?? null)},\n  afterSignOut: ${JSON.stringify(selection.modules.includes("marketing") ? "/" : "/sign-in")},\n};\n`
    );
  }
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
  const unique = [...new Set(keys)]
    .filter(
      (key) =>
        selection.target !== "cloudflare" ||
        (key !== "NEXT_PUBLIC_SENTRY_DSN" && key !== "SENTRY_AUTH_TOKEN")
    )
    .sort();
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
  const removeCloudflare = async () => {
    await removePath(join(target, "cloudflare"));
    await removePath(join(target, "open-next.config.ts"));
    await removePath(join(target, "src", "lib", "cloudflare"));
    await removePath(join(target, "wrangler.jsonc"));
  };

  if (selection.target === "docker") {
    await removeServer();
    await removeVercel();
    await removeCloudflare();
    return;
  }
  if (selection.target === "server") {
    await removeDocker();
    await removeVercel();
    await removeCloudflare();
    return;
  }
  if (selection.target === "vercel") {
    await removeDocker();
    await removeServer();
    await removeCloudflare();
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
  await writeJson(
    join(target, "wrangler.jsonc"),
    cloudflareConfig(target, selection)
  );
  await writeJson(
    join(target, "cloudflare", "preflight-config.json"),
    cloudflarePreflightConfig(target, selection)
  );
  await writeText(
    join(target, "src", "db", "index.ts"),
    cloudflareDatabaseSource()
  );
  await writeText(
    join(target, "src", "lib", "runtime-config.ts"),
    'export { cleanRuntimeValue, getRuntimeEnv, getRuntimeEnvironment } from "../../cloudflare/runtime-config";\n'
  );
  await writeText(
    join(target, "src", "lib", "monitoring", "index.ts"),
    cloudflareMonitoringSource()
  );
  await removePath(join(target, "src", "instrumentation.ts"));
  await removePath(join(target, "sentry.client.config.ts"));
  await removePath(join(target, "sentry.edge.config.ts"));
  await removePath(join(target, "sentry.server.config.ts"));
  await rewriteCloudflareRuntime(target, selection);
}

async function rewritePackage(
  target: string,
  selection: ProjectSelection,
  catalog: RecipeCatalog,
  skinDependencies: Readonly<Record<string, string>> = {},
  sourceDependencies: ReadonlySet<string> = new Set()
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
  Object.assign(packageJson.dependencies, skinDependencies);
  for (const packageName of ["framer-motion", "geist"]) {
    if (!sourceDependencies.has(packageName)) {
      delete packageJson.dependencies[packageName];
      delete packageJson.devDependencies[packageName];
    }
  }
  if (!hasModule(selection, "analytics")) {
    delete packageJson.dependencies["@next/third-parties"];
  }
  if (!hasModule(selection, "auth")) {
    delete packageJson.dependencies["better-auth"];
    delete packageJson.dependencies["next-safe-action"];
  }
  if (!hasModule(selection, "marketing")) {
    delete packageJson.dependencies["fumadocs-core"];
    delete packageJson.dependencies["fumadocs-mdx"];
    delete packageJson.scripts.postinstall;
  } else {
    packageJson.scripts.postinstall = "fumadocs-mdx";
  }
  packageJson.name = projectName(target);
  packageJson.private = true;
  pruneRepositoryOnlyPackageEntries(packageJson);
  delete packageJson.scripts["verify:generated"];
  delete packageJson.scripts["deploy:check"];
  delete packageJson.scripts["deploy:server:build"];
  delete packageJson.scripts["verify:health"];
  packageJson.scripts["db:generate"] =
    "drizzle-kit generate && pnpm exec biome format --write drizzle/meta && node scripts/check-generated-migrations.mjs";
  packageJson.scripts["db:generate:init"] =
    "drizzle-kit generate --name init && pnpm exec biome format --write drizzle/meta && node scripts/check-generated-migrations.mjs";
  packageJson.scripts["db:generate:checked"] =
    "node scripts/check-generated-migrations.mjs";
  if (selection.target !== "cloudflare") {
    packageJson.scripts["deploy:check"] = "node deploy/check-health.mjs";
    packageJson.scripts["verify:health"] =
      "node deploy/verify-production-health.mjs";
  }
  if (selection.target === "server") {
    packageJson.scripts["deploy:server:build"] = "bash deploy/server/build.sh";
  }
  if (selection.target === "cloudflare") {
    delete packageJson.dependencies["@react-email/components"];
    delete packageJson.dependencies["@react-email/render"];
    delete packageJson.dependencies["@react-email/tailwind"];
    delete packageJson.dependencies["@sentry/nextjs"];
    delete packageJson.dependencies.pino;
    delete packageJson.dependencies.pg;
    delete packageJson.dependencies.ws;
    delete packageJson.devDependencies["@types/pg"];
    delete packageJson.devDependencies["@types/ws"];
    delete packageJson.devDependencies["pino-pretty"];
    packageJson.scripts["cf:check"] = "node cloudflare/preflight.mjs";
    packageJson.scripts["cf:build"] =
      "node cloudflare/preflight.mjs --build && opennextjs-cloudflare build";
    packageJson.scripts["cf:deploy"] =
      "node cloudflare/preflight.mjs --deploy && opennextjs-cloudflare build && wrangler deploy --minify";
    packageJson.scripts["cf:preview"] =
      "node cloudflare/preflight.mjs --build && opennextjs-cloudflare build && wrangler dev";
    packageJson.scripts["cf:types"] = "wrangler types";
  } else {
    delete packageJson.scripts["cf:build"];
    delete packageJson.scripts["cf:deploy"];
    delete packageJson.scripts["cf:preview"];
    delete packageJson.scripts["cf:check"];
    delete packageJson.scripts["cf:types"];
    delete packageJson.devDependencies["@opennextjs/cloudflare"];
    delete packageJson.devDependencies.wrangler;
  }
  await writeJson(path, packageJson);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function rewriteLockfile(
  target: string,
  skinDependencies: Readonly<Record<string, string>>
): Promise<boolean> {
  const packageJson = JSON.parse(
    await readFile(join(target, "package.json"), "utf8")
  ) as Record<string, unknown>;
  const lockfilePath = join(target, "pnpm-lock.yaml");
  const lockfile = parse(await readFile(lockfilePath, "utf8")) as unknown;
  if (!isRecord(lockfile) || !isRecord(lockfile.importers)) {
    throw new Error("Generated pnpm lockfile has no importers");
  }
  const rootImporter = lockfile.importers["."];
  if (!isRecord(rootImporter)) {
    throw new Error("Generated pnpm lockfile has no root importer");
  }

  const updates: Array<{
    group: "dependencies" | "devDependencies" | "optionalDependencies";
    entries: Record<string, unknown>;
  }> = [];
  for (const group of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ] as const) {
    const selected = packageJson[group];
    const locked = rootImporter[group];
    if (selected === undefined) {
      updates.push({ group, entries: {} });
      continue;
    }
    if (!isRecord(selected)) throw new Error(`Invalid generated ${group}`);
    if (!isRecord(locked)) return true;
    const entries: Record<string, unknown> = {};
    for (const [name, specifier] of Object.entries(selected)) {
      const entry = locked[name];
      if (!isRecord(entry) || typeof specifier !== "string") {
        return true;
      }
      const exactSkinVersion = skinDependencies[name];
      if (exactSkinVersion) {
        const lockedVersion =
          typeof entry.version === "string"
            ? entry.version.split("(", 1)[0]
            : "";
        if (lockedVersion !== exactSkinVersion) return true;
      }
      entries[name] = { ...entry, specifier };
    }
    updates.push({ group, entries });
  }

  for (const { group, entries } of updates) {
    if (Object.keys(entries).length === 0) delete rootImporter[group];
    else rootImporter[group] = entries;
  }
  await writeText(lockfilePath, stringify(lockfile, { lineWidth: 0 }));
  return false;
}

async function writeSmokeTest(
  target: string,
  manifest: GeneratedProjectManifest
): Promise<void> {
  await removePath(join(target, "src", "test"));
  await writeText(
    join(target, "src", "test", "generated.test.ts"),
    `import { describe, expect, it } from "vitest";\nimport manifest from "../../nextdevtpl.generated.json";\n\ndescribe("generated project", () => {\n  it("records a stable selection", () => {\n    expect(manifest.mode).toBe(${JSON.stringify(manifest.mode)});\n    expect(manifest.modules).toEqual(${JSON.stringify(manifest.modules)});\n    expect(manifest.target).toBe(${JSON.stringify(manifest.target)});\n  });\n});\n`
  );
  await writeText(
    join(target, "vitest.config.ts"),
    `import { defineConfig } from "vitest/config";\n\nexport default defineConfig({ test: { environment: "node", include: ["src/test/**/*.test.ts"] } });\n`
  );
}

function createDemoTranslationSelection(
  catalog: RecipeCatalog
): ProjectSelection {
  const requested = [...DEMO_VIEW_MODULES, "credits", "subscription"];
  const resolved = new Set<string>();
  const add = (id: string) => {
    if (resolved.has(id)) return;
    const module = catalog.modules[id];
    if (!module)
      throw new GeneratorError(`Demo module is not registered: ${id}`);
    for (const dependency of module.dependencies) add(dependency);
    resolved.add(id);
  };
  for (const module of requested) add(module);
  const modules = [...resolved];
  const selected = new Set(modules);
  return {
    preset: "custom",
    target: "server",
    modules,
    views: modules.flatMap((id) => catalog.modules[id]?.views ?? []),
    adapters: {},
    bindings: [],
    env: [],
    packages: [],
    excludedModules: Object.keys(catalog.modules).filter(
      (id) => !selected.has(id)
    ),
  };
}

export async function generateProject(
  options: GeneratorOptions,
  hooks: GeneratorTestHooks = {}
): Promise<{
  manifest: GeneratedProjectManifest;
  targetDirectory: string;
  warnings: readonly string[];
}> {
  if (
    options.mode !== undefined &&
    options.mode !== "full" &&
    options.mode !== "demo"
  ) {
    throw new GeneratorError("Generation mode must be full or demo");
  }
  validateDemoOptions(options);
  const demoMode = options.mode === "demo";
  const discovered = await findGeneratorAssets();
  const assets = {
    catalogPath: options.catalogPath ?? discovered.catalogPath,
    paletteDirectory: discovered.paletteDirectory,
    templateManifestPath:
      options.templateManifestPath ?? discovered.templateManifestPath,
    templateRoot: options.templateRoot ?? discovered.templateRoot,
  };
  const catalog = await loadCatalog(assets.catalogPath, {
    templateRoot: assets.templateRoot,
  });
  const selection = demoMode
    ? createDemoTranslationSelection(catalog)
    : createProjectSelection(catalog, options);
  const skinModules = demoMode ? DEMO_VIEW_MODULES : selection.modules;
  const skinSelection: SkinSourceSelection = options.skin ?? {
    kind: "builtin",
    id: "default",
  };
  if (
    options.palette !== undefined &&
    (skinSelection.kind !== "builtin" || skinSelection.id !== "default")
  ) {
    throw new GeneratorError(
      "StyleKit palettes are available only for the built-in default skin"
    );
  }
  const skinSource = await resolveSkinSource(skinSelection, {
    templateRoot: assets.templateRoot,
    ...hooks.sourceOptions,
  });
  let loadedPalette: LoadedPalette | undefined;
  let stage: Awaited<ReturnType<typeof createGenerationStage>> | undefined;

  try {
    const validatedSkin = await validateSkinPackage({
      directory: skinSource.directory,
      templateDirectory: assets.templateRoot,
      catalog,
      selectedModules: skinModules,
    });
    if (demoMode) await validateDemoClientViews(validatedSkin, catalog);
    const preparedDemoData = demoMode
      ? await prepareDemoData(validatedSkin)
      : undefined;
    if (options.palette !== undefined) {
      if (
        validatedSkin.manifest.id !== "default" ||
        !validatedSkin.manifest.supportsPalettes
      ) {
        throw new GeneratorError(
          "StyleKit palettes are available only for the built-in default skin"
        );
      }
      try {
        loadedPalette = await loadPaletteSelection(
          assets.paletteDirectory,
          options.palette
        );
      } catch {
        throw new GeneratorError(
          "Selected StyleKit palette is invalid or unavailable"
        );
      }
    }
    const target = await prepareTarget(options.targetDirectory);
    return await runInTargetTransaction(
      target.path,
      target.created,
      target.identity,
      async () => {
        const generationStage = await createGenerationStage(target.path);
        stage = generationStage;
        const workPath = generationStage.project;
        await copyTemplate(
          assets.templateRoot,
          assets.templateManifestPath,
          workPath
        );
        let appliedSkin: Awaited<ReturnType<typeof applySkinPackage>>;
        if (demoMode) {
          await pruneDemoBackendFiles(workPath);
          await rewriteModuleRegistry(workPath, selection);
          await writeWorkspaceComposition(workPath, selection.modules, {
            docsEnabled: false,
          });
          await writeDemoRuntime(workPath);
          appliedSkin = await applySkinPackage({
            skin: validatedSkin,
            targetDirectory: workPath,
            catalog,
            selectedModules: skinModules,
            additionalAssetFiles: preparedDemoData!.avatarAssets,
          });
          await writeDemoSkinViewsFromManifest(
            workPath,
            catalog,
            appliedSkin.manifest.viewEntries
          );
          await writePreparedDemoData(workPath, preparedDemoData!);
          await writeDemoAvatarAssets(
            workPath,
            preparedDemoData!.avatarAssetContents
          );
          await rewriteTranslations(
            workPath,
            selection,
            catalog,
            appliedSkin.manifest.id
          );
          await rewriteComposition(workPath, selection);
          await writeDemoPageFacade(workPath);
          await rewriteDeployment(workPath, selection);
        } else {
          await removePath(join(workPath, "drizzle"));
          await removePath(join(workPath, "src", "core", "skin", "demo"));
          await removePath(
            join(workPath, "src", "modules", "demo-skin-views.ts")
          );
          await pruneModules(workPath, selection, catalog);
          await rewriteAdapters(workPath, selection, catalog);
          await rewriteServices(workPath, selection);
          await rewriteModuleRegistry(workPath, selection);
          await writeSelectedSkinViews(workPath, selection.modules, catalog);
          await writeWorkspaceComposition(workPath, selection.modules);
          appliedSkin = await applySkinPackage({
            skin: validatedSkin,
            targetDirectory: workPath,
            catalog,
            selectedModules: selection.modules,
          });
        }
        if (loadedPalette) {
          const skinDirectory = join(workPath, "src", "skin");
          const tokensPath = join(skinDirectory, "tokens.css");
          const appliedPalette = applyPaletteToTokensCss(
            await readFile(tokensPath, "utf8"),
            loadedPalette.palette
          );
          if (appliedPalette.changed) {
            await writeText(tokensPath, appliedPalette.css);
            await refreshSkinFileHashes(skinDirectory);
          }
          await writeText(
            join(workPath, "STYLEKIT-LICENSE.txt"),
            [
              "StyleKit",
              `Theme: ${loadedPalette.palette.id}`,
              `Source: https://www.stylekit.top/r/${loadedPalette.palette.id}.json`,
              `Snapshot date: ${loadedPalette.snapshotDate}`,
              "",
              loadedPalette.license.trimEnd(),
              "",
            ].join("\n")
          );
        }
        if (!demoMode) {
          await rewriteSchema(workPath, selection, catalog);
          await rewriteTranslations(
            workPath,
            selection,
            catalog,
            appliedSkin.manifest.id
          );
          await rewriteComposition(workPath, selection);
          await rewriteEnvironment(workPath, selection);
          await rewriteDeployment(workPath, selection);
        }
        const skinDependencies = Object.fromEntries(
          [...appliedSkin.reachableDependencies.keys()].flatMap((name) => {
            const version = appliedSkin.manifest.dependencies[name];
            return version ? [[name, version]] : [];
          })
        );
        const sourceDependencies = await collectSourcePackageImports(
          join(workPath, "src")
        );
        if (demoMode) {
          await rewriteDemoProjectConfig(
            workPath,
            sourceDependencies,
            skinDependencies
          );
        } else {
          await rewritePackage(
            workPath,
            selection,
            catalog,
            skinDependencies,
            sourceDependencies
          );
        }
        const packageManager = options.packageManager ?? "pnpm";
        const childEnvironment = skinProcessEnvironment(skinSelection);
        const requiresLockOnly = await rewriteLockfile(
          workPath,
          skinDependencies
        );
        if (requiresLockOnly) {
          await updateLockfileOnly(
            workPath,
            packageManager,
            childEnvironment,
            hooks.runProcess
          );
        }

        const manifest: GeneratedProjectManifest = {
          catalogVersion: catalog.version,
          mode: demoMode ? "demo" : "full",
          preset: demoMode ? "custom" : selection.preset,
          target: selection.target,
          modules: demoMode ? [] : selection.modules,
          adapters: demoMode ? {} : selection.adapters,
          bindings: demoMode ? [] : selection.bindings,
          ...(demoMode
            ? {
                viewModules: [...DEMO_VIEW_MODULES],
                demo: { dataSha256: preparedDemoData!.dataSha256 },
              }
            : {}),
          skin: {
            id: validatedSkin.manifest.id,
            version: validatedSkin.manifest.version,
            packageHash: validatedSkin.packageHash,
            source: skinSource.source,
            ...(loadedPalette
              ? {
                  palette: {
                    provider: "stylekit" as const,
                    id: loadedPalette.palette.id,
                    snapshotDate: loadedPalette.snapshotDate,
                    sourceSha256: loadedPalette.palette.sourceSha256,
                  },
                }
              : {}),
          } satisfies GeneratedSkinRecord,
        };
        await writeJson(join(workPath, "nextdevtpl.generated.json"), manifest);
        await writeSmokeTest(workPath, manifest);
        await deliverStage(
          workPath,
          target.path,
          hooks.afterStageFileDelivered
        );
        if (options.install !== false) {
          await installDependencies(
            target.path,
            packageManager,
            childEnvironment,
            hooks.runProcess
          );
          if (!demoMode) {
            await runPackageScript(
              target.path,
              packageManager,
              "db:generate:init",
              childEnvironment,
              hooks.runProcess
            );
          }
          if (!demoMode && selection.target === "cloudflare") {
            await runPackageScript(
              target.path,
              packageManager,
              "cf:types",
              childEnvironment,
              hooks.runProcess
            );
          }
        }
        return {
          manifest,
          targetDirectory: target.path,
          warnings: loadedPalette?.warnings ?? [],
        };
      }
    );
  } catch (error) {
    throw sanitizeSkinError(error, skinSelection);
  } finally {
    try {
      await stage?.dispose();
    } finally {
      await skinSource.dispose();
    }
  }
}
