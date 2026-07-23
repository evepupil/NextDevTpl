"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { getMyPlanAction } from "../actions";
import { PlanBadge, type PlanType } from "./plan-badge";

export function CurrentPlanBadge() {
  const { execute: fetchPlan, result } = useAction(getMyPlanAction);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const plan = (result.data?.plan as PlanType) || "free";
  return <PlanBadge plan={plan} size="xs" />;
}
