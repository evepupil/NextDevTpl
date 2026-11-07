import type { CreditUsageModel } from "../../../features/credits/view/contracts.js";
import { isIncomeTransactionType } from "../../../features/credits/view/transaction-direction.js";
import type { DashboardOverviewData } from "../../../features/dashboard/view/contracts.js";
import type { SettingsBillingHistoryItem } from "../../../features/settings/view/contracts.js";
import type {
  SupportDetailViewProps,
  SupportListViewProps,
} from "../../../features/support/view/contracts.js";
import { PLAN_CATALOG } from "../../plans/catalog.js";
import type {
  DemoCreditBatch,
  DemoCreditTransaction,
  DemoData,
} from "./types.js";

type SortOrder = "ascending" | "descending";

function sortByTimestamp<T extends { readonly createdAt: string }>(
  items: readonly T[],
  order: SortOrder
): T[] {
  return items
    .map((item, index) => ({ index, item }))
    .sort((left, right) => {
      if (left.item.createdAt === right.item.createdAt) {
        return left.index - right.index;
      }
      if (order === "ascending") {
        return left.item.createdAt < right.item.createdAt ? -1 : 1;
      }
      return left.item.createdAt > right.item.createdAt ? -1 : 1;
    })
    .map(({ item }) => item);
}

export function resolveDemoAssetUrl(path: string | null): string | null {
  return path === null ? null : `/skin-assets/${path}`;
}

export function projectDashboardOverview(
  data: DemoData
): DashboardOverviewData {
  return {
    credits: {
      balance: data.workspace.credits.balance,
      totalEarned: data.workspace.credits.totalEarned,
      totalSpent: data.workspace.credits.totalSpent,
      transactions: sortByTimestamp(
        data.workspace.credits.transactions,
        "descending"
      ).map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        isIncome: isIncomeTransactionType(transaction.type),
        createdAt: transaction.createdAt,
      })),
    },
    plan: {
      planName: PLAN_CATALOG.plans[data.workspace.plan.id].name,
      hasActiveSubscription: data.workspace.plan.isActive,
      cancelAtPeriodEnd: data.workspace.plan.cancelAtPeriodEnd,
      currentPeriodEnd: data.workspace.plan.currentPeriodEnd,
    },
  };
}

export function projectSupportList(
  data: DemoData,
  locale: string
): SupportListViewProps {
  return {
    locale,
    tickets: sortByTimestamp(data.support.tickets, "descending").map(
      (ticket) => ({
        category: ticket.category,
        createdAt: ticket.createdAt,
        id: ticket.id,
        priority: ticket.priority,
        status: ticket.status,
        subject: ticket.subject,
      })
    ),
  };
}

export function projectSupportDetail(
  data: DemoData,
  ticketId: string,
  locale: string
): SupportDetailViewProps | null {
  const ticket = data.support.tickets.find((item) => item.id === ticketId);
  if (!ticket) return null;

  const user = data.workspace.user;
  return {
    currentUserId: user.id,
    locale,
    ticket: {
      category: ticket.category,
      createdAt: ticket.createdAt,
      id: ticket.id,
      priority: ticket.priority,
      status: ticket.status,
      subject: ticket.subject,
    },
    messages: sortByTimestamp(ticket.messages, "ascending").map((message) => {
      const author =
        message.author.kind === "current-user"
          ? {
              id: user.id,
              image: user.image,
              name: user.name,
            }
          : {
              id: message.author.id,
              image: message.author.image,
              name: message.author.name,
            };
      return {
        content: message.content,
        createdAt: message.createdAt,
        id: message.id,
        isAdminResponse: message.author.kind === "staff",
        user: {
          ...author,
          image: resolveDemoAssetUrl(author.image),
        },
      };
    }),
  };
}

export function projectCreditUsage(
  data: DemoData,
  options: {
    readonly page: number;
    readonly pageSize: number;
    readonly describeTransaction: (
      transaction: DemoCreditTransaction
    ) => string;
  }
): CreditUsageModel {
  const page =
    Number.isSafeInteger(options.page) && options.page > 0 ? options.page : 1;
  const pageSize =
    Number.isSafeInteger(options.pageSize) && options.pageSize > 0
      ? options.pageSize
      : 10;
  const transactions = sortByTimestamp(
    data.workspace.credits.transactions,
    "descending"
  );
  const expiringBatches = data.workspace.credits.batches.filter(
    (batch): batch is DemoCreditBatch & { readonly expiresAt: string } =>
      batch.expiresAt !== null && batch.expiresAt > data.snapshotAt
  );
  const expiringBatch = expiringBatches
    .map((batch, index) => ({ batch, index }))
    .sort((left, right) => {
      if (left.batch.expiresAt === right.batch.expiresAt) {
        return left.index - right.index;
      }
      return left.batch.expiresAt < right.batch.expiresAt ? -1 : 1;
    })[0]?.batch;
  const totalCount = transactions.length;

  return {
    balance: data.workspace.credits.balance,
    expiringBatch,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    transactions: transactions
      .slice((page - 1) * pageSize, page * pageSize)
      .map((transaction) => ({
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        displayDescription: options.describeTransaction(transaction),
        id: transaction.id,
        isIncome: isIncomeTransactionType(transaction.type),
        type: transaction.type,
      })),
  };
}

export function projectBillingHistory(
  data: DemoData
): SettingsBillingHistoryItem[] {
  return sortByTimestamp(data.workspace.billingHistory, "descending").map(
    (item) => ({
      createdAt: item.createdAt,
      effectiveAt: item.effectiveAt,
      eventType: item.eventType,
      fromPlanName:
        item.fromPlanId === null
          ? null
          : PLAN_CATALOG.plans[item.fromPlanId].name,
      id: item.id,
      toPlanName:
        item.toPlanId === null ? null : PLAN_CATALOG.plans[item.toPlanId].name,
    })
  );
}
