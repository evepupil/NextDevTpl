import type { PlanId, QueuePriority } from "./contracts.js";

export type PlanFeatureKey =
  | "creditsNeverExpire"
  | "input"
  | "characters"
  | "fileSize"
  | "queue"
  | "export"
  | "history"
  | "customCards"
  | "aiAssist"
  | "support";

export interface PlanCatalogEntry {
  name: string;
  description: string;
  cta: string;
  monthlyCredits: number;
  maxFileSizeBytes: number;
  queuePriority: QueuePriority;
  maxCharactersPerTask: number;
  prices: { month: number; year: number };
  featureKeys: readonly PlanFeatureKey[];
  popular?: boolean;
}

export const PLAN_CATALOG = {
  currency: "USD",
  yearlyDiscount: 40,
  plans: {
    free: {
      name: "Free",
      description: "Try NextDevTpl with no commitment",
      cta: "Get Started",
      monthlyCredits: 200,
      maxFileSizeBytes: 5 * 1024 * 1024,
      queuePriority: "normal",
      maxCharactersPerTask: 10_000,
      prices: { month: 0, year: 0 },
      featureKeys: [
        "creditsNeverExpire",
        "input",
        "characters",
        "fileSize",
        "export",
        "history",
      ],
    },
    starter: {
      name: "Starter",
      description: "For casual learners",
      cta: "Subscribe",
      monthlyCredits: 3_000,
      maxFileSizeBytes: 20 * 1024 * 1024,
      queuePriority: "normal",
      maxCharactersPerTask: 100_000,
      prices: { month: 5, year: 35 },
      featureKeys: [
        "creditsNeverExpire",
        "input",
        "characters",
        "fileSize",
        "export",
        "history",
        "support",
      ],
    },
    pro: {
      name: "Pro",
      description: "For serious learners",
      cta: "Subscribe",
      monthlyCredits: 8_000,
      maxFileSizeBytes: 50 * 1024 * 1024,
      queuePriority: "priority",
      maxCharactersPerTask: 300_000,
      prices: { month: 9, year: 65 },
      featureKeys: [
        "creditsNeverExpire",
        "input",
        "characters",
        "fileSize",
        "queue",
        "export",
        "history",
        "customCards",
        "support",
      ],
      popular: true,
    },
    ultra: {
      name: "Ultra",
      description: "For power users & educators",
      cta: "Subscribe",
      monthlyCredits: 16_000,
      maxFileSizeBytes: 100 * 1024 * 1024,
      queuePriority: "highest",
      maxCharactersPerTask: 1_000_000,
      prices: { month: 15, year: 109 },
      featureKeys: [
        "creditsNeverExpire",
        "input",
        "characters",
        "fileSize",
        "queue",
        "export",
        "history",
        "customCards",
        "aiAssist",
        "support",
      ],
    },
  },
} as const satisfies {
  currency: string;
  yearlyDiscount: number;
  plans: Record<PlanId, PlanCatalogEntry>;
};

function formatCharacterLimit(amount: number): string {
  return amount >= 1_000_000 ? `${amount / 1_000_000}M` : `${amount / 1_000}K`;
}

function formatFileSize(bytes: number): string {
  return `${bytes / (1024 * 1024)}MB`;
}

const featureLabels: Record<
  PlanFeatureKey,
  (planId: PlanId, plan: PlanCatalogEntry) => string
> = {
  creditsNeverExpire: () => "Credits never expire",
  input: (planId) =>
    planId === "free" || planId === "starter"
      ? "Text & file input"
      : "All input sources (URL, video, etc.)",
  characters: (_planId, plan) =>
    `Up to ${formatCharacterLimit(plan.maxCharactersPerTask)} characters per task`,
  fileSize: (_planId, plan) =>
    `Max ${formatFileSize(plan.maxFileSizeBytes)} file size`,
  queue: (_planId, plan) =>
    plan.queuePriority === "highest"
      ? "Highest priority queue"
      : "Priority generation queue",
  export: () => "Export to Anki & Markdown",
  history: () => "Deck history saved forever",
  customCards: () => "🚧 Custom card styles (coming soon)",
  aiAssist: () => "🚧 AI-assisted card making (coming soon)",
  support: (planId) =>
    planId === "starter"
      ? "Email support"
      : planId === "pro"
        ? "Priority support"
        : "Dedicated support",
};

export function getPricingPlanFeatureLabels(planId: PlanId): string[] {
  const plan = PLAN_CATALOG.plans[planId];
  const creditLine =
    planId === "free"
      ? `${plan.monthlyCredits} credits (one-time)`
      : `${plan.monthlyCredits.toLocaleString("en-US")} credits / month`;

  return [
    creditLine,
    ...plan.featureKeys
      .filter((key) => key !== "creditsNeverExpire")
      .map((key) => featureLabels[key](planId, plan)),
  ];
}
