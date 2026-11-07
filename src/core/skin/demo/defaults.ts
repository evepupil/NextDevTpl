import { validateDemoData } from "./schema.js";
import type { DemoData } from "./types.js";

const defaultDemoData = {
  schemaVersion: 1,
  snapshotAt: "2026-11-07T00:00:00.000Z",
  workspace: {
    user: {
      id: "demo-user",
      name: "Alex Morgan",
      email: "alex@example.test",
      image: null,
    },
    plan: {
      id: "pro",
      interval: "month",
      isActive: true,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: "2026-12-07T00:00:00.000Z",
      pendingPlanId: null,
      pendingPriceEffectiveAt: null,
    },
    credits: {
      balance: 750,
      totalEarned: 1000,
      totalSpent: 250,
      batches: [
        { remaining: 500, expiresAt: null },
        { remaining: 250, expiresAt: "2026-12-15T00:00:00.000Z" },
      ],
      transactions: [
        {
          id: "tx-purchase-01",
          type: "purchase",
          amount: 1000,
          description: null,
          createdAt: "2026-11-01T09:00:00.000Z",
        },
        {
          id: "tx-consume-01",
          type: "consumption",
          amount: 250,
          description: "Reference document translation",
          createdAt: "2026-11-04T12:30:00.000Z",
        },
      ],
    },
    billingHistory: [
      {
        id: "billing-created-01",
        eventType: "created",
        createdAt: "2026-10-07T00:00:00.000Z",
        effectiveAt: "2026-10-07T00:00:00.000Z",
        fromPlanId: null,
        toPlanId: "pro",
      },
    ],
  },
  support: {
    tickets: [
      {
        id: "ticket-setup-01",
        category: "technical",
        priority: "medium",
        status: "in_progress",
        subject: "Question about workspace setup",
        createdAt: "2026-11-03T08:00:00.000Z",
        messages: [
          {
            id: "message-user-01",
            content: "How can I update the workspace profile?",
            createdAt: "2026-11-03T08:00:00.000Z",
            author: { kind: "current-user" },
          },
          {
            id: "message-staff-01",
            content: "Open Settings, then edit the profile section.",
            createdAt: "2026-11-03T10:20:00.000Z",
            author: {
              kind: "staff",
              id: "demo-support",
              name: "Support Team",
              image: null,
            },
          },
        ],
      },
    ],
  },
} satisfies DemoData;

export const DEFAULT_DEMO_DATA: DemoData = validateDemoData(defaultDemoData);
