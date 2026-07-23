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
  "storage:r2-binding": `import { createR2BindingStorageAdapter } from "@/adapters/storage";

// M5 replaces this empty map with runtime Env bindings.
export const storageService = createR2BindingStorageAdapter({});
`,
  "mail:disabled": `import { disabledMailAdapter } from "@/adapters/mail";

export const mailService = disabledMailAdapter;

export function isMailServiceConfigured(): boolean {
  return false;
}
`,
  "mail:resend": `import { createResendMailAdapter } from "@/adapters/mail";

export const mailService = createResendMailAdapter();

export function isMailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
`,
  "mail:smtp": `import { createSmtpMailAdapter } from "@/adapters/mail";

export const mailService = createSmtpMailAdapter();

export function isMailServiceConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}
`,
  "mail:cloudflare-email": `import { createCloudflareEmailAdapter } from "@/adapters/mail";

export const mailService = createCloudflareEmailAdapter({
  async send() {
    throw new Error("Cloudflare SendEmail binding is not injected; complete M5 deployment wiring");
  },
});

export function isMailServiceConfigured(): boolean {
  return false;
}
`,
  "ai:openai-compatible": `import { createOpenAICompatibleAdapter } from "@/adapters/ai";

export type OpenAICompatibleProvider = "deepseek" | "mimo" | "openai";

export function getAIProvider(): OpenAICompatibleProvider {
  const provider = process.env.AI_PROVIDER;
  return provider === "deepseek" || provider === "mimo" ? provider : "openai";
}

export function getAIModel(): string {
  switch (getAIProvider()) {
    case "deepseek": return process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
    case "mimo": return process.env.MIMO_MODEL ?? "mimo-v2-flash";
    case "openai": return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }
}

const provider = getAIProvider();
export const aiService = createOpenAICompatibleAdapter({
  model: getAIModel(),
  ...(provider === "deepseek" ? { apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com/v1" } : {}),
  ...(provider === "mimo" ? { apiKey: process.env.MIMO_API_KEY, baseURL: "https://api.xiaomimimo.com/v1" } : {}),
  ...(provider === "openai" ? { apiKey: process.env.OPENAI_API_KEY } : {}),
});
`,
  "ai:anthropic": `import { createAnthropicAdapter } from "@/adapters/ai";

export function getAIProvider() {
  return "anthropic" as const;
}

export function getAIModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet";
}

export const aiService = createAnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: getAIModel(),
});
`,
  "ai:workers-ai": `import { createWorkersAIAdapter } from "@/adapters/ai";

export function getAIProvider() {
  return "workers-ai" as const;
}

export function getAIModel(): string {
  return process.env.WORKERS_AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct";
}

export const aiService = createWorkersAIAdapter({
  model: getAIModel(),
  binding: {
    async run() {
      throw new Error("Workers AI binding is not injected; complete M5 deployment wiring");
    },
  },
});
`,
  "jobs:inngest": `import { createInngestJobAdapter } from "@/adapters/jobs";

export const jobService = createInngestJobAdapter();
`,
  "jobs:cloudflare-workflows": `import { createCloudflareWorkflowsAdapter } from "@/adapters/jobs";

// M5 replaces this empty map with runtime Env bindings.
export const jobService = createCloudflareWorkflowsAdapter({});
`,
  "rate-limit:noop": `import { noopRateLimitAdapter, noopUsageQuotaAdapter } from "@/adapters/rate-limit";

export const rateLimitService = noopRateLimitAdapter;
export const anonymousQuotaService = noopUsageQuotaAdapter;
`,
  "rate-limit:upstash": `import { createUpstashServices, noopRateLimitAdapter, noopUsageQuotaAdapter } from "@/adapters/rate-limit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstash = url && token ? createUpstashServices({ url, token }) : null;

export const rateLimitService = upstash?.rateLimit ?? noopRateLimitAdapter;
export const anonymousQuotaService = upstash?.quota ?? noopUsageQuotaAdapter;
`,
  "rate-limit:cloudflare-rate-limit": `import { createCloudflareRateLimitAdapter, noopUsageQuotaAdapter } from "@/adapters/rate-limit";

// M5 replaces this empty map with runtime Env bindings.
export const rateLimitService = createCloudflareRateLimitAdapter({});
export const anonymousQuotaService = noopUsageQuotaAdapter;
`,
};

export const serviceExportNames: Readonly<Record<ServiceKind, string>> = {
  ai: 'export { aiService, getAIModel, getAIProvider } from "./ai";\n',
  jobs: 'export { jobService } from "./jobs";\n',
  mail: 'export { isMailServiceConfigured, mailService } from "./mail";\n',
  payment: 'export { paymentService } from "./payment";\n',
  "rate-limit":
    'export { anonymousQuotaService, rateLimitService } from "./rate-limit";\n',
  storage: 'export { storageService } from "./storage";\n',
};
