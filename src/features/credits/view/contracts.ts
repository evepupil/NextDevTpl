export interface BalanceBadgeController {
  balance: number;
  isPending: boolean;
}

export interface CreditUsageBatch {
  expiresAt: Date | string | null;
  remaining: number;
}

export interface CreditUsageTransaction {
  amount: number;
  createdAt: Date | string;
  displayDescription: string;
  id: string;
  isIncome: boolean;
  type: string;
}

export interface CreditUsageModel {
  balance: number;
  expiringBatch: CreditUsageBatch | undefined;
  totalCount: number;
  totalPages: number;
  transactions: CreditUsageTransaction[];
}

export interface CreditUsageState {
  isBalanceLoading: boolean;
  isTransactionsLoading: boolean;
  page: number;
  pageSize: number;
}

export interface CreditUsageActions {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface CreditUsageController {
  actions: CreditUsageActions;
  model: CreditUsageModel;
  state: CreditUsageState;
}
