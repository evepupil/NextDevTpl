import type { PlanId, PlanInterval } from "../../plans/contracts.js";
import { mergeDemoData } from "./merge.js";
import type { DemoCreateTicketInput } from "./runtime-contracts.js";
import type {
  DemoBillingHistoryItem,
  DemoData,
  DemoTicket,
  DemoTicketMessage,
} from "./types.js";

export interface DemoTicketCreationResult {
  readonly data: DemoData;
  readonly ticketId: string;
}

function appendWithinLimit<T extends { readonly createdAt: string }>(
  items: readonly T[],
  nextItem: T,
  maximum: number
): readonly T[] {
  if (maximum < 1) return [nextItem];

  const retained = [...items];
  while (retained.length >= maximum) {
    let oldestIndex = 0;
    for (let index = 1; index < retained.length; index += 1) {
      const candidate = retained[index];
      const oldest = retained[oldestIndex];
      if (candidate && oldest && candidate.createdAt < oldest.createdAt) {
        oldestIndex = index;
      }
    }
    retained.splice(oldestIndex, 1);
  }
  return [...retained, nextItem];
}

function nextPeriodEnd(at: string, interval: PlanInterval): string {
  const timestamp = Date.parse(at);
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid demo action timestamp");
  }

  const end = new Date(timestamp);
  const dayOfMonth = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + (interval === "year" ? 12 : 1));
  const lastDayOfMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)
  ).getUTCDate();
  end.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));
  return end.toISOString();
}

export function updateDemoProfile(data: DemoData, name: string): DemoData {
  if (name.length < 2 || name.length > 50) {
    throw new Error("Invalid demo profile name");
  }
  return mergeDemoData(data, {
    schemaVersion: 1,
    workspace: { user: { name } },
  });
}

export function changeDemoPlan(
  data: DemoData,
  planId: PlanId,
  interval: PlanInterval,
  historyId: string,
  at: string
): DemoData {
  const currentPlan = data.workspace.plan;
  const effectiveInterval = planId === "free" ? "month" : interval;
  if (
    currentPlan.id === planId &&
    currentPlan.interval === effectiveInterval &&
    currentPlan.pendingPlanId === null &&
    !currentPlan.cancelAtPeriodEnd
  ) {
    return data;
  }

  const periodEnd =
    planId === "free" ? null : nextPeriodEnd(at, effectiveInterval);
  const historyItem: DemoBillingHistoryItem = {
    id: historyId,
    eventType:
      currentPlan.id === "free" && planId !== "free" ? "created" : "changed",
    createdAt: at,
    effectiveAt: at,
    fromPlanId: currentPlan.id === "free" ? null : currentPlan.id,
    toPlanId: planId === "free" ? null : planId,
  };

  return mergeDemoData(data, {
    schemaVersion: 1,
    workspace: {
      plan: {
        id: planId,
        interval: effectiveInterval,
        isActive: planId !== "free",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: periodEnd,
        pendingPlanId: null,
        pendingPriceEffectiveAt: null,
      },
      billingHistory: appendWithinLimit(
        data.workspace.billingHistory,
        historyItem,
        50
      ),
    },
  });
}

export function cancelDemoSubscription(
  data: DemoData,
  historyId: string,
  at: string
): DemoData {
  const currentPlan = data.workspace.plan;
  if (
    currentPlan.id === "free" ||
    !currentPlan.isActive ||
    currentPlan.cancelAtPeriodEnd
  ) {
    return data;
  }

  const historyItem: DemoBillingHistoryItem = {
    id: historyId,
    eventType: "cancellation_requested",
    createdAt: at,
    effectiveAt: at,
    fromPlanId: currentPlan.id,
    toPlanId: null,
  };
  return mergeDemoData(data, {
    schemaVersion: 1,
    workspace: {
      plan: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd:
          currentPlan.currentPeriodEnd ??
          nextPeriodEnd(at, currentPlan.interval),
        pendingPlanId: null,
        pendingPriceEffectiveAt: null,
      },
      billingHistory: appendWithinLimit(
        data.workspace.billingHistory,
        historyItem,
        50
      ),
    },
  });
}

export function resumeDemoSubscription(
  data: DemoData,
  historyId: string,
  at: string
): DemoData {
  const currentPlan = data.workspace.plan;
  if (
    currentPlan.id === "free" ||
    !currentPlan.isActive ||
    !currentPlan.cancelAtPeriodEnd
  ) {
    return data;
  }

  const historyItem: DemoBillingHistoryItem = {
    id: historyId,
    eventType: "cancellation_resumed",
    createdAt: at,
    effectiveAt: at,
    fromPlanId: null,
    toPlanId: currentPlan.id,
  };
  return mergeDemoData(data, {
    schemaVersion: 1,
    workspace: {
      plan: { cancelAtPeriodEnd: false },
      billingHistory: appendWithinLimit(
        data.workspace.billingHistory,
        historyItem,
        50
      ),
    },
  });
}

export function createDemoTicket(
  data: DemoData,
  input: DemoCreateTicketInput,
  ticketId: string,
  messageId: string,
  at: string
): DemoTicketCreationResult {
  const ticket: DemoTicket = {
    id: ticketId,
    category: input.category,
    priority: input.priority,
    status: "open",
    subject: input.subject,
    createdAt: at,
    messages: [
      {
        id: messageId,
        content: input.message,
        createdAt: at,
        author: { kind: "current-user" },
      },
    ],
  };
  const nextData = mergeDemoData(data, {
    schemaVersion: 1,
    support: {
      tickets: appendWithinLimit(data.support.tickets, ticket, 50),
    },
  });
  return { data: nextData, ticketId };
}

export function replyToDemoTicket(
  data: DemoData,
  ticketId: string,
  content: string,
  messageId: string,
  at: string
): DemoData | null {
  const ticket = data.support.tickets.find(
    (candidate) => candidate.id === ticketId
  );
  if (!ticket || ticket.status === "closed") return null;

  const message: DemoTicketMessage = {
    id: messageId,
    content,
    createdAt: at,
    author: { kind: "current-user" },
  };
  const updatedTicket: DemoTicket = {
    ...ticket,
    messages: appendWithinLimit(ticket.messages, message, 50),
  };
  return mergeDemoData(data, {
    schemaVersion: 1,
    support: {
      tickets: data.support.tickets.map((candidate) =>
        candidate.id === ticketId ? updatedTicket : candidate
      ),
    },
  });
}
