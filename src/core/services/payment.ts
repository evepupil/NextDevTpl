import type { AdapterDescriptor, JsonObject } from "./common";

export type PaymentProvider = "creem" | "stripe";
export type PaymentStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";
export type PaymentWebhookType =
  | "checkout.completed"
  | "subscription.active"
  | "subscription.canceled"
  | "subscription.expired"
  | "subscription.paid"
  | "subscription.past_due"
  | "subscription.paused"
  | "subscription.renewed";

export interface PaymentCapabilities {
  customerPortal: boolean;
  oneTimePayments: boolean;
  subscriptions: boolean;
  webhooks: boolean;
}

export interface PaymentCustomer {
  id: string;
  email?: string;
  name?: string;
}

export interface PaymentSubscription {
  id: string;
  status: PaymentStatus;
  productId: string;
  customerId: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  metadata: Readonly<Record<string, string>>;
}

export interface PaymentCheckout {
  id: string;
  mode: "one-time" | "subscription";
  productId: string;
  customer: PaymentCustomer;
  status: string;
  subscription: PaymentSubscription | null;
  metadata: Readonly<Record<string, string>>;
}

export interface CreateCheckoutInput {
  cancelUrl?: string;
  mode?: "one-time" | "subscription";
  productId: string;
  successUrl: string;
  requestId?: string;
  metadata?: Readonly<Record<string, string>>;
}

export interface CreateCheckoutResult {
  id: string;
  status: string;
  url: string;
}

export interface VerifyPaymentWebhookInput {
  payload: string;
  signature: string;
  secret?: string;
}

export interface PaymentWebhookEvent {
  id: string;
  type: PaymentWebhookType;
  createdAt: Date;
  checkout: PaymentCheckout | null;
  subscription: PaymentSubscription | null;
  rawMetadata: JsonObject;
}

export interface PaymentAdapter
  extends AdapterDescriptor<PaymentProvider, PaymentCapabilities> {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  getSubscription(id: string): Promise<PaymentSubscription>;
  cancelSubscription(id: string): Promise<PaymentSubscription>;
  verifyWebhook(input: VerifyPaymentWebhookInput): Promise<PaymentWebhookEvent>;
}
