/**
 * 积分系统类型定义
 */

import type { CreditsBatchSource, CreditsTransactionType } from "@/db/schema";

/**
 * 发放积分参数
 */
export interface GrantCreditsParams {
  userId: string;
  amount: number;
  sourceType: CreditsBatchSource;
  debitAccount: string;
  transactionType: CreditsTransactionType;
  expiresAt?: Date | null;
  sourceRef?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 消费积分参数
 */
export interface ConsumeCreditsParams {
  userId: string;
  amount: number;
  serviceName: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 积分消费结果
 */
export interface ConsumeCreditsResult {
  success: boolean;
  consumedAmount: number;
  remainingBalance: number;
  transactionId: string;
  consumedBatches: Array<{
    batchId: string;
    consumedFromBatch: number;
  }>;
}
