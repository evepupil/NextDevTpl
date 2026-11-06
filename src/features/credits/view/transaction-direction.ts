const INCOME_TRANSACTION_TYPES = new Set([
  "purchase",
  "monthly_grant",
  "registration_bonus",
  "admin_grant",
  "refund",
]);

export function isIncomeTransactionType(type: string): boolean {
  return INCOME_TRANSACTION_TYPES.has(type);
}
