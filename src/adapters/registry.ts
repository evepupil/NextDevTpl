import {
  defineServiceAdapter,
  type ServiceAdapterManifest,
  type ServiceKind,
  validateServiceAdapterManifests,
} from "@/core/services";

const manifests = [
  defineServiceAdapter({
    id: "payment:creem",
    service: "payment",
    source: "src/adapters/payment/creem.ts",
    runtime: "node",
    packages: [],
    env: ["CREEM_API_KEY", "CREEM_WEBHOOK_SECRET"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "payment:stripe",
    service: "payment",
    source: "src/adapters/payment/stripe.ts",
    runtime: "universal",
    packages: [],
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "storage:s3-compatible",
    service: "storage",
    source: "src/adapters/storage/s3-compatible.ts",
    runtime: "node",
    packages: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
    env: [
      "STORAGE_ACCESS_KEY_ID",
      "STORAGE_SECRET_ACCESS_KEY",
      "STORAGE_ENDPOINT",
      "STORAGE_REGION",
    ],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "storage:r2-binding",
    service: "storage",
    source: "src/adapters/storage/r2-binding.ts",
    runtime: "worker",
    packages: [],
    env: [],
    bindings: ["R2Bucket"],
  }),
  defineServiceAdapter({
    id: "mail:disabled",
    service: "mail",
    source: "src/adapters/mail/disabled.ts",
    runtime: "universal",
    packages: [],
    env: [],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "mail:resend",
    service: "mail",
    source: "src/adapters/mail/resend.ts",
    runtime: "universal",
    packages: ["resend"],
    env: ["RESEND_API_KEY", "EMAIL_FROM"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "mail:smtp",
    service: "mail",
    source: "src/adapters/mail/smtp.ts",
    runtime: "node",
    packages: ["nodemailer"],
    env: ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "mail:cloudflare-email",
    service: "mail",
    source: "src/adapters/mail/cloudflare-email.ts",
    runtime: "worker",
    packages: [],
    env: ["EMAIL_FROM"],
    bindings: ["SendEmail"],
  }),
  defineServiceAdapter({
    id: "ai:openai-compatible",
    service: "ai",
    source: "src/adapters/ai/openai-compatible.ts",
    runtime: "universal",
    packages: ["openai"],
    env: [
      "AI_PROVIDER",
      "OPENAI_API_KEY",
      "OPENAI_MODEL",
      "DEEPSEEK_API_KEY",
      "DEEPSEEK_MODEL",
      "MIMO_API_KEY",
      "MIMO_MODEL",
      "CF_AIG_BASE_URL",
      "CF_AIG_TOKEN",
    ],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "ai:anthropic",
    service: "ai",
    source: "src/adapters/ai/anthropic.ts",
    runtime: "universal",
    packages: [],
    env: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "ai:workers-ai",
    service: "ai",
    source: "src/adapters/ai/workers-ai.ts",
    runtime: "worker",
    packages: [],
    env: ["WORKERS_AI_MODEL"],
    bindings: ["Ai"],
  }),
  defineServiceAdapter({
    id: "jobs:inngest",
    service: "jobs",
    source: "src/adapters/jobs/inngest",
    runtime: "universal",
    packages: ["inngest"],
    env: ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "jobs:cloudflare-workflows",
    service: "jobs",
    source: "src/adapters/jobs/cloudflare-workflows.ts",
    runtime: "worker",
    packages: [],
    env: [],
    bindings: ["Workflow"],
  }),
  defineServiceAdapter({
    id: "rate-limit:noop",
    service: "rate-limit",
    source: "src/adapters/rate-limit/noop.ts",
    runtime: "universal",
    packages: [],
    env: [],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "rate-limit:upstash",
    service: "rate-limit",
    source: "src/adapters/rate-limit/upstash.ts",
    runtime: "universal",
    packages: ["@upstash/ratelimit", "@upstash/redis"],
    env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    bindings: [],
  }),
  defineServiceAdapter({
    id: "rate-limit:cloudflare-rate-limit",
    service: "rate-limit",
    source: "src/adapters/rate-limit/cloudflare.ts",
    runtime: "worker",
    packages: [],
    env: [],
    bindings: ["RateLimit"],
  }),
] as const satisfies readonly ServiceAdapterManifest[];

const errors = validateServiceAdapterManifests(manifests);
if (errors.length > 0) {
  throw new Error(`服务适配器注册失败：\n${errors.join("\n")}`);
}

export const serviceAdapterRegistry = manifests;
export type ServiceAdapterId = (typeof manifests)[number]["id"];
type RegisteredServiceAdapter = (typeof manifests)[number];
type ServiceAdapterIdFor<Kind extends ServiceKind> = Extract<
  RegisteredServiceAdapter,
  { service: Kind }
>["id"];

export const defaultServiceAdapters = {
  payment: "payment:creem",
  storage: "storage:s3-compatible",
  mail: "mail:resend",
  ai: "ai:openai-compatible",
  jobs: "jobs:inngest",
  "rate-limit": "rate-limit:upstash",
} as const satisfies Record<ServiceKind, ServiceAdapterId>;

export type ServiceAdapterChoices = {
  readonly [Kind in ServiceKind]: ServiceAdapterIdFor<Kind>;
};

export interface ServiceAdapterSelection {
  bindings: readonly string[];
  env: readonly string[];
  manifests: readonly ServiceAdapterManifest[];
  packages: readonly string[];
  sources: readonly string[];
}

export function createServiceAdapterSelection(
  choices: ServiceAdapterChoices
): ServiceAdapterSelection {
  const selectedIds = new Set<ServiceAdapterId>(Object.values(choices));
  const selected = serviceAdapterRegistry.filter((manifest) =>
    selectedIds.has(manifest.id)
  );

  if (selected.length !== Object.keys(choices).length) {
    throw new Error("服务适配器选择包含未注册项或重复项");
  }
  for (const manifest of selected) {
    if (choices[manifest.service] !== manifest.id) {
      throw new Error(`适配器 ${manifest.id} 的能力分类不匹配`);
    }
  }

  return {
    manifests: selected,
    sources: selected.map((manifest) => manifest.source),
    packages: [...new Set(selected.flatMap((manifest) => manifest.packages))],
    env: [...new Set(selected.flatMap((manifest) => manifest.env))],
    bindings: [...new Set(selected.flatMap((manifest) => manifest.bindings))],
  };
}
