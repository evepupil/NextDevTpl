import type { ServiceKind } from "./types.js";

export const adapterExports: Readonly<Record<string, string>> = {
  "payment:creem": 'export { createCreemPaymentAdapter } from "./creem";\n',
  "payment:stripe": 'export { createStripePaymentAdapter } from "./stripe";\n',
  "storage:s3-compatible":
    'export { createS3CompatibleStorageAdapter } from "./s3-compatible";\n',
  "storage:r2-binding":
    'export { createR2BindingStorageAdapter, type R2BucketPort } from "./r2-binding";\n',
  "mail:disabled": 'export { disabledMailAdapter } from "./disabled";\n',
  "mail:resend": 'export { createResendMailAdapter } from "./resend";\n',
  "mail:smtp": 'export { createSmtpMailAdapter } from "./smtp";\n',
  "mail:cloudflare-email":
    'export { createCloudflareEmailAdapter, type CloudflareEmailBindingPort } from "./cloudflare-email";\n',
  "ai:openai-compatible":
    'export { createOpenAICompatibleAdapter } from "./openai-compatible";\n',
  "ai:anthropic": 'export { createAnthropicAdapter } from "./anthropic";\n',
  "ai:workers-ai":
    'export { createWorkersAIAdapter, type WorkersAIBindingPort } from "./workers-ai";\n',
  "alerts:noop": 'export { noopAlertAdapter } from "./noop";\n',
  "alerts:email":
    'export { createEmailAlertAdapter, type EmailAlertConfig } from "./email";\nexport { noopAlertAdapter } from "./noop";\n',
  "alerts:webhook":
    'export { createWebhookAlertAdapter, type WebhookAlertConfig } from "./webhook";\nexport { noopAlertAdapter } from "./noop";\n',
  "analytics:noop": 'export { noopTelemetryAdapter } from "./noop";\n',
  "analytics:logger":
    'export { createLoggerTelemetryAdapter, type TelemetryLogSink } from "./logger";\n',
  "analytics:posthog":
    'export { createPostHogTelemetryAdapter, type PostHogConfig } from "./posthog";\n',
  "analytics:ga4":
    'export { createGa4TelemetryAdapter, type Ga4Config } from "./ga4";\n',
  "analytics:umami":
    'export { createUmamiTelemetryAdapter, type UmamiConfig } from "./umami";\n',
  "jobs:inngest": 'export { createInngestJobAdapter } from "./inngest";\n',
  "jobs:cloudflare-workflows":
    'export { createCloudflareWorkflowsAdapter, type WorkflowBindingPort } from "./cloudflare-workflows";\n',
  "rate-limit:noop":
    'export { noopRateLimitAdapter, noopUsageQuotaAdapter } from "./noop";\n',
  "rate-limit:upstash":
    'export { createUpstashServices, type UpstashServices } from "./upstash";\n',
  "rate-limit:cloudflare-rate-limit":
    'export { createCloudflareRateLimitAdapter, type CloudflareRateLimitBindingPort } from "./cloudflare";\n',
};

export const serviceSources: Readonly<Record<string, string>> = {
  "payment:creem": `import { createCreemPaymentAdapter } from "@/adapters/payment";

export const paymentService = createCreemPaymentAdapter();
`,
  "payment:stripe": `import { createStripePaymentAdapter } from "@/adapters/payment";

export const paymentService = createStripePaymentAdapter();
`,
  "storage:s3-compatible": `import { createS3CompatibleStorageAdapter } from "@/adapters/storage";

export const storageService = createS3CompatibleStorageAdapter();
`,
  "storage:r2-binding": `import { createR2BindingStorageAdapter, type R2BucketPort } from "@/adapters/storage";
import { createCloudflareBindingMap } from "@/lib/cloudflare/bindings";

export const storageService = createR2BindingStorageAdapter(
  createCloudflareBindingMap<R2BucketPort>("NEXTDEVTPL_STORAGE")
);
`,
  "mail:disabled": `import { disabledMailAdapter } from "@/adapters/mail";

export const mailService = disabledMailAdapter;

export function isMailServiceConfigured(): boolean {
  return false;
}
`,
  "mail:resend": `import { createResendMailAdapter } from "@/adapters/mail";
import { getRuntimeEnv } from "@/lib/runtime-config";

export const mailService = createResendMailAdapter();

export function isMailServiceConfigured(): boolean {
  return Boolean(getRuntimeEnv("RESEND_API_KEY"));
}
`,
  "mail:smtp": `import { createSmtpMailAdapter } from "@/adapters/mail";
import { getRuntimeEnv } from "@/lib/runtime-config";

export const mailService = createSmtpMailAdapter();

export function isMailServiceConfigured(): boolean {
  return Boolean(getRuntimeEnv("SMTP_HOST"));
}
`,
  "mail:cloudflare-email": `import { createCloudflareEmailAdapter, type CloudflareEmailBindingPort } from "@/adapters/mail";
import { createLazyCloudflareBinding } from "@/lib/cloudflare/bindings";

export const mailService = createCloudflareEmailAdapter(
  createLazyCloudflareBinding<CloudflareEmailBindingPort>("NEXTDEVTPL_EMAIL")
);

export function isMailServiceConfigured(): boolean {
  return true;
}
`,
  "ai:openai-compatible": `import { createOpenAICompatibleAdapter } from "@/adapters/ai";
import { getRuntimeEnv } from "@/lib/runtime-config";

export type OpenAICompatibleProvider = "deepseek" | "mimo" | "openai";

export function getAIProvider(): OpenAICompatibleProvider {
  const provider = getRuntimeEnv("AI_PROVIDER");
  return provider === "deepseek" || provider === "mimo" ? provider : "openai";
}

export function getAIModel(): string {
  switch (getAIProvider()) {
    case "deepseek": return getRuntimeEnv("DEEPSEEK_MODEL") ?? "deepseek-chat";
    case "mimo": return getRuntimeEnv("MIMO_MODEL") ?? "mimo-v2-flash";
    case "openai": return getRuntimeEnv("OPENAI_MODEL") ?? "gpt-4o-mini";
  }
}

const provider = getAIProvider();
export const aiService = createOpenAICompatibleAdapter({
  model: getAIModel(),
  ...(provider === "deepseek" ? { apiKey: getRuntimeEnv("DEEPSEEK_API_KEY"), baseURL: "https://api.deepseek.com/v1" } : {}),
  ...(provider === "mimo" ? { apiKey: getRuntimeEnv("MIMO_API_KEY"), baseURL: "https://api.xiaomimimo.com/v1" } : {}),
  ...(provider === "openai" ? { apiKey: getRuntimeEnv("OPENAI_API_KEY") } : {}),
});
`,
  "ai:anthropic": `import { createAnthropicAdapter } from "@/adapters/ai";
import { getRuntimeEnv } from "@/lib/runtime-config";

export function getAIProvider() {
  return "anthropic" as const;
}

export function getAIModel(): string {
  return getRuntimeEnv("ANTHROPIC_MODEL") ?? "claude-sonnet";
}

export const aiService = createAnthropicAdapter({
  apiKey: getRuntimeEnv("ANTHROPIC_API_KEY"),
  model: getAIModel(),
});
`,
  "ai:workers-ai": `import { createWorkersAIAdapter, type WorkersAIBindingPort } from "@/adapters/ai";
import { createLazyCloudflareBinding } from "@/lib/cloudflare/bindings";
import { getRuntimeEnv } from "@/lib/runtime-config";

export function getAIProvider() {
  return "workers-ai" as const;
}

export function getAIModel(): string {
  return getRuntimeEnv("WORKERS_AI_MODEL") ?? "@cf/meta/llama-3.1-8b-instruct";
}

export const aiService = createWorkersAIAdapter({
  model: getAIModel(),
  binding: createLazyCloudflareBinding<WorkersAIBindingPort>("AI"),
});
`,
  "alerts:noop": `import { noopAlertAdapter } from "@/adapters/alerts";
import { createAlertService } from "@/core/services";

export const alertService = createAlertService(noopAlertAdapter);
`,
  "alerts:email": `import {
  createEmailAlertAdapter,
  noopAlertAdapter,
} from "@/adapters/alerts";
import { createAlertService } from "@/core/services";
import { getRuntimeEnv } from "@/lib/runtime-config";
import { mailService } from "./mail";

const from = getRuntimeEnv("EMAIL_FROM");
const to = getRuntimeEnv("ALERT_EMAIL_TO")
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const alertService = createAlertService(
  from && to?.length
    ? createEmailAlertAdapter({ from, mail: mailService, to })
    : noopAlertAdapter
);
`,
  "alerts:webhook": `import {
  createWebhookAlertAdapter,
  noopAlertAdapter,
} from "@/adapters/alerts";
import { createAlertService } from "@/core/services";
import { getRuntimeEnv } from "@/lib/runtime-config";

const url = getRuntimeEnv("ALERT_WEBHOOK_URL");
const secret = getRuntimeEnv("ALERT_WEBHOOK_SECRET");

export const alertService = createAlertService(
  url
    ? createWebhookAlertAdapter({ ...(secret ? { secret } : {}), url })
    : noopAlertAdapter
);
`,
  "analytics:noop": `import {
  createTelemetryService,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { noopTelemetryAdapter } from "@/adapters/analytics";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production": return "production";
    case "test": return "test";
    case "preview": return "preview";
    default: return "development";
  }
}

const release = getRuntimeEnv("APP_VERSION");
export const telemetryService = createTelemetryService(noopTelemetryAdapter, {
  environment: getTelemetryEnvironment(),
  ...(release ? { release } : {}),
});

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
`,
  "analytics:logger": `import {
  createTelemetryService,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { createLoggerTelemetryAdapter } from "@/adapters/analytics";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production": return "production";
    case "test": return "test";
    case "preview": return "preview";
    default: return "development";
  }
}

const release = getRuntimeEnv("APP_VERSION");
export const telemetryService = createTelemetryService(
  createLoggerTelemetryAdapter(),
  {
    environment: getTelemetryEnvironment(),
    ...(release ? { release } : {}),
    onAdapterError(error, event) {
      logError(error, {
        eventId: event.eventId,
        eventName: event.name,
        provider: "logger",
        source: "telemetry-adapter",
      });
    },
  }
);

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
`,
  "analytics:posthog": `import {
  createTelemetryService,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { createPostHogTelemetryAdapter } from "@/adapters/analytics";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production": return "production";
    case "test": return "test";
    case "preview": return "preview";
    default: return "development";
  }
}

const apiKey = getRuntimeEnv("POSTHOG_API_KEY");
const host = getRuntimeEnv("POSTHOG_HOST");
const release = getRuntimeEnv("APP_VERSION");
export const telemetryService = createTelemetryService(
  createPostHogTelemetryAdapter({
    ...(apiKey ? { apiKey } : {}),
    ...(host ? { host } : {}),
  }),
  {
    environment: getTelemetryEnvironment(),
    ...(release ? { release } : {}),
    onAdapterError(error, event) {
      logError(error, {
        eventId: event.eventId,
        eventName: event.name,
        provider: "posthog",
        source: "telemetry-adapter",
      });
    },
  }
);

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
`,
  "analytics:ga4": `import {
  createTelemetryService,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { createGa4TelemetryAdapter } from "@/adapters/analytics";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production": return "production";
    case "test": return "test";
    case "preview": return "preview";
    default: return "development";
  }
}

const measurementId = getRuntimeEnv("GA4_MEASUREMENT_ID");
const apiSecret = getRuntimeEnv("GA4_API_SECRET");
const release = getRuntimeEnv("APP_VERSION");
export const telemetryService = createTelemetryService(
  createGa4TelemetryAdapter({
    ...(measurementId ? { measurementId } : {}),
    ...(apiSecret ? { apiSecret } : {}),
  }),
  {
    environment: getTelemetryEnvironment(),
    ...(release ? { release } : {}),
    onAdapterError(error, event) {
      logError(error, {
        eventId: event.eventId,
        eventName: event.name,
        provider: "ga4",
        source: "telemetry-adapter",
      });
    },
  }
);

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
`,
  "analytics:umami": `import {
  createTelemetryService,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { createUmamiTelemetryAdapter } from "@/adapters/analytics";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production": return "production";
    case "test": return "test";
    case "preview": return "preview";
    default: return "development";
  }
}

const websiteId = getRuntimeEnv("UMAMI_WEBSITE_ID");
const apiKey = getRuntimeEnv("UMAMI_API_KEY");
const host = getRuntimeEnv("UMAMI_HOST");
const siteUrl = getRuntimeEnv("NEXT_PUBLIC_APP_URL");
const release = getRuntimeEnv("APP_VERSION");
export const telemetryService = createTelemetryService(
  createUmamiTelemetryAdapter({
    ...(websiteId ? { websiteId } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(host ? { host } : {}),
    ...(siteUrl ? { siteUrl } : {}),
  }),
  {
    environment: getTelemetryEnvironment(),
    ...(release ? { release } : {}),
    onAdapterError(error, event) {
      logError(error, {
        eventId: event.eventId,
        eventName: event.name,
        provider: "umami",
        source: "telemetry-adapter",
      });
    },
  }
);

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
`,
  "analytics:none": `import {
  createTelemetryService,
  type TelemetryAdapter,
  type TelemetryEnvironment,
  type TelemetryEventInput,
} from "@/core/services";
import { logError } from "@/lib/logger";
import { getRuntimeEnv } from "@/lib/runtime-config";

function getTelemetryEnvironment(): TelemetryEnvironment {
  switch (getRuntimeEnv("NODE_ENV")) {
    case "production": return "production";
    case "test": return "test";
    case "preview": return "preview";
    default: return "development";
  }
}

const noopTelemetryAdapter: TelemetryAdapter = {
  provider: "noop",
  capabilities: {
    clientEvents: false,
    identityLinking: false,
    query: false,
    serverEvents: true,
  },
  async track() {
    // 未配置分析服务时不产生外部请求。
  },
};

const release = getRuntimeEnv("APP_VERSION");
export const telemetryService = createTelemetryService(
  noopTelemetryAdapter,
  {
    environment: getTelemetryEnvironment(),
    ...(release ? { release } : {}),
    onAdapterError(error, event) {
      logError(error, {
        eventId: event.eventId,
        eventName: event.name,
        provider: "noop",
        source: "telemetry-adapter",
      });
    },
  }
);

export function trackServerEvent(input: TelemetryEventInput): void {
  void telemetryService.track(input).catch(() => {
    // 埋点失败不能影响原始业务请求。
  });
}
`,
  "jobs:inngest": `import { createInngestJobAdapter } from "@/adapters/jobs";

export const jobService = createInngestJobAdapter();
`,
  "jobs:cloudflare-workflows": `import { createCloudflareWorkflowsAdapter, type WorkflowBindingPort } from "@/adapters/jobs";
import { createCloudflareBindingMap } from "@/lib/cloudflare/bindings";

export const jobService = createCloudflareWorkflowsAdapter(
  createCloudflareBindingMap<WorkflowBindingPort>("NEXTDEVTPL_WORKFLOW")
);
`,
  "rate-limit:noop": `import { noopRateLimitAdapter, noopUsageQuotaAdapter } from "@/adapters/rate-limit";

export const rateLimitService = noopRateLimitAdapter;
export const anonymousQuotaService = noopUsageQuotaAdapter;
`,
  "rate-limit:upstash": `import { createUpstashServices, noopRateLimitAdapter, noopUsageQuotaAdapter } from "@/adapters/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-config";

const url = getRuntimeEnv("UPSTASH_REDIS_REST_URL");
const token = getRuntimeEnv("UPSTASH_REDIS_REST_TOKEN");
const upstash = url && token ? createUpstashServices({ url, token }) : null;

export const rateLimitService = upstash?.rateLimit ?? noopRateLimitAdapter;
export const anonymousQuotaService = upstash?.quota ?? noopUsageQuotaAdapter;
`,
  "rate-limit:cloudflare-rate-limit": `import { createCloudflareRateLimitAdapter, type CloudflareRateLimitBindingPort, noopUsageQuotaAdapter } from "@/adapters/rate-limit";
import { createLazyCloudflareBinding } from "@/lib/cloudflare/bindings";

const binding = (name: string) =>
  createLazyCloudflareBinding<CloudflareRateLimitBindingPort>(name);

export const rateLimitService = createCloudflareRateLimitAdapter({
  ai: binding("RATE_LIMIT_AI"),
  auth: binding("RATE_LIMIT_AUTH"),
  global: binding("RATE_LIMIT_GLOBAL"),
  payment: binding("RATE_LIMIT_PAYMENT"),
  strict: binding("RATE_LIMIT_STRICT"),
  telemetry: binding("RATE_LIMIT_TELEMETRY"),
  upload: binding("RATE_LIMIT_UPLOAD"),
});
export const anonymousQuotaService = noopUsageQuotaAdapter;
`,
};

export const serviceExportNames: Readonly<Record<ServiceKind, string>> = {
  ai: 'export { aiService, getAIModel, getAIProvider } from "./ai";\n',
  alerts: 'export { alertService } from "./alerts";\n',
  analytics:
    'export { telemetryService, trackServerEvent } from "./telemetry";\nexport { trackCoreActionCompleted, trackFirstValueCompleted } from "@/lib/telemetry/events";\n',
  jobs: 'export { jobService } from "./jobs";\n',
  mail: 'export { isMailServiceConfigured, mailService } from "./mail";\n',
  payment: 'export { paymentService } from "./payment";\n',
  "rate-limit":
    'export { anonymousQuotaService, rateLimitService } from "./rate-limit";\n',
  storage: 'export { storageService } from "./storage";\n',
};
