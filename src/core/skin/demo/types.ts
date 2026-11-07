import type { CreditTransactionType } from "../../credits/contracts.js";
import type {
  PlanId,
  PlanInterval,
  SubscriptionHistoryEventType,
} from "../../plans/contracts.js";
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../support/contracts.js";

export interface DemoUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly image: string | null;
}

export interface DemoPlanState {
  readonly id: PlanId;
  readonly interval: PlanInterval;
  readonly isActive: boolean;
  readonly cancelAtPeriodEnd: boolean;
  readonly currentPeriodEnd: string | null;
  readonly pendingPlanId: PlanId | null;
  readonly pendingPriceEffectiveAt: string | null;
}

export interface DemoCreditBatch {
  readonly remaining: number;
  readonly expiresAt: string | null;
}

interface DemoCreditTransactionBase {
  readonly id: string;
  readonly amount: number;
  readonly description: string | null;
  readonly createdAt: string;
}

export type DemoCreditTransaction =
  | (DemoCreditTransactionBase & {
      readonly type: "monthly_grant";
      readonly grant: {
        readonly planId: Exclude<PlanId, "free">;
        readonly interval: PlanInterval;
      };
    })
  | (DemoCreditTransactionBase & {
      readonly type: Exclude<CreditTransactionType, "monthly_grant">;
      readonly grant?: never;
    });

export interface DemoCredits {
  readonly balance: number;
  readonly totalEarned: number;
  readonly totalSpent: number;
  readonly batches: readonly DemoCreditBatch[];
  readonly transactions: readonly DemoCreditTransaction[];
}

export interface DemoBillingHistoryItem {
  readonly id: string;
  readonly eventType: SubscriptionHistoryEventType;
  readonly createdAt: string;
  readonly effectiveAt: string;
  readonly fromPlanId: PlanId | null;
  readonly toPlanId: PlanId | null;
}

export type DemoTicketAuthor =
  | { readonly kind: "current-user" }
  | {
      readonly kind: "staff";
      readonly id: string;
      readonly name: string;
      readonly image: string | null;
    };

export interface DemoTicketMessage {
  readonly id: string;
  readonly content: string;
  readonly createdAt: string;
  readonly author: DemoTicketAuthor;
}

export interface DemoTicket {
  readonly id: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly subject: string;
  readonly createdAt: string;
  readonly messages: readonly DemoTicketMessage[];
}

export interface DemoData {
  readonly schemaVersion: 1;
  readonly snapshotAt: string;
  readonly workspace: {
    readonly user: DemoUser;
    readonly plan: DemoPlanState;
    readonly credits: DemoCredits;
    readonly billingHistory: readonly DemoBillingHistoryItem[];
  };
  readonly support: { readonly tickets: readonly DemoTicket[] };
}

export interface DemoDataPatch {
  readonly schemaVersion: 1;
  readonly snapshotAt?: string;
  readonly workspace?: {
    readonly user?: Partial<DemoUser>;
    readonly plan?: Partial<DemoPlanState>;
    readonly credits?: Partial<DemoCredits>;
    readonly billingHistory?: readonly DemoBillingHistoryItem[];
  };
  readonly support?: { readonly tickets?: readonly DemoTicket[] };
}
