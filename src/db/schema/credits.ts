import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const creditsBalanceStatusEnum = pgEnum("credits_balance_status", [
  "active",
  "frozen",
]);
export const creditsBatchStatusEnum = pgEnum("credits_batch_status", [
  "active",
  "consumed",
  "expired",
]);
export const creditsBatchSourceEnum = pgEnum("credits_batch_source", [
  "purchase",
  "subscription",
  "bonus",
  "refund",
]);
export const creditsTransactionTypeEnum = pgEnum("credits_transaction_type", [
  "purchase",
  "consumption",
  "monthly_grant",
  "registration_bonus",
  "admin_grant",
  "expiration",
  "refund",
]);

export const creditsBalance = pgTable("credits_balance", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  status: creditsBalanceStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditsBatch = pgTable("credits_batch", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  remaining: integer("remaining").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: creditsBatchStatusEnum("status").notNull().default("active"),
  sourceType: creditsBatchSourceEnum("source_type").notNull(),
  sourceRef: text("source_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditsTransaction = pgTable("credits_transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: creditsTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  debitAccount: text("debit_account").notNull(),
  creditAccount: text("credit_account").notNull(),
  description: text("description"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CreditsBalance = typeof creditsBalance.$inferSelect;
export type NewCreditsBalance = typeof creditsBalance.$inferInsert;
export type CreditsBatch = typeof creditsBatch.$inferSelect;
export type NewCreditsBatch = typeof creditsBatch.$inferInsert;
export type CreditsTransaction = typeof creditsTransaction.$inferSelect;
export type NewCreditsTransaction = typeof creditsTransaction.$inferInsert;
export type CreditsBalanceStatus =
  (typeof creditsBalanceStatusEnum.enumValues)[number];
export type CreditsBatchStatus =
  (typeof creditsBatchStatusEnum.enumValues)[number];
export type CreditsBatchSource =
  (typeof creditsBatchSourceEnum.enumValues)[number];
export type CreditsTransactionType =
  (typeof creditsTransactionTypeEnum.enumValues)[number];
