"use client";

import { Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useWorkspaceCredits, useWorkspacePlan } from "@/modules/view-runtime";

import { PlanBadge } from "./plan-badge";

export function AccountCreditsBadge() {
  const { balance, isPending } = useWorkspaceCredits();

  if (isPending) {
    return (
      <Badge variant="secondary" className="gap-1 px-2 py-1">
        <Coins className="h-3 w-3" />
        <span className="text-xs">...</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1 px-2 py-1 bg-warning/15 text-warning hover:bg-warning/25"
      title="Available Credits"
    >
      <Coins className="h-3 w-3" />
      <span className="text-xs font-medium">{balance.toLocaleString()}</span>
    </Badge>
  );
}

export function AccountPlanBadge() {
  const { id } = useWorkspacePlan();

  return <PlanBadge plan={id} size="xs" />;
}
