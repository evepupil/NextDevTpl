export const CREDIT_TRANSACTION_TYPES = [
  "purchase",
  "consumption",
  "monthly_grant",
  "registration_bonus",
  "admin_grant",
  "expiration",
  "refund",
] as const;

export type CreditTransactionType = (typeof CREDIT_TRANSACTION_TYPES)[number];
