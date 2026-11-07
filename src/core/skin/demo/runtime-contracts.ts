import type { PlanId, PlanInterval } from "../../plans/contracts.js";
import type {
  TicketCategory,
  TicketPriority,
} from "../../support/contracts.js";
import type { DemoData } from "./types.js";

export interface DemoStoreState {
  readonly data: DemoData;
  readonly sessionUserId: string | null;
  readonly billingInterval: PlanInterval;
  readonly avatarPreview: string | null;
}

export interface DemoCreateTicketInput {
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly subject: string;
  readonly message: string;
}

export interface DemoStoreActions {
  signIn(): void;
  signUp(): void;
  signOut(): void;
  deleteAccount(): void;
  updateProfile(input: { readonly name: string }): void;
  setAvatarPreview(url: string | null): void;
  setBillingInterval(interval: PlanInterval): void;
  changePlan(planId: PlanId, interval: PlanInterval): void;
  cancelSubscription(): void;
  resumeSubscription(): void;
  createTicket(input: DemoCreateTicketInput): string;
  replyToTicket(ticketId: string, content: string): boolean;
}

export interface DemoStoreContextValue {
  readonly state: DemoStoreState;
  readonly actions: DemoStoreActions;
}
