import { eq } from "drizzle-orm";

import { db } from "@/db";
import { creditsBalance } from "@/db/schema/credits";

import { getUserTransactions } from "./query";
import { isIncomeTransactionType } from "./view/transaction-direction";

export async function getDashboardCredits(userId: string) {
  const [balanceData, transactions] = await Promise.all([
    db.query.creditsBalance.findFirst({
      where: eq(creditsBalance.userId, userId),
    }),
    getUserTransactions(userId, { limit: 6 }),
  ]);

  return {
    balance: balanceData?.balance ?? 0,
    totalEarned: balanceData?.totalEarned ?? 0,
    totalSpent: balanceData?.totalSpent ?? 0,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      isIncome: isIncomeTransactionType(transaction.type),
      createdAt: transaction.createdAt.toISOString(),
    })),
  };
}
