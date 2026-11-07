"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { PLAN_IDS } from "@/core/plans/contracts";
import { getMyPlanAction } from "@/features/subscription/actions";

import type { PlanBadgeController } from "./contracts";

export type { PlanBadgeController } from "./contracts";

export function usePlanBadgeController(): PlanBadgeController {
  const { execute, result } = useAction(getMyPlanAction);

  useEffect(() => {
    execute();
  }, [execute]);

  const id = PLAN_IDS.find((plan) => plan === result.data?.plan) ?? "free";
  return { id };
}
