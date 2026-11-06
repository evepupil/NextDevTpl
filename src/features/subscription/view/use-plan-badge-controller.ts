"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { getMyPlanAction } from "@/features/subscription/actions";

const PLAN_IDS = ["free", "starter", "pro", "ultra"] as const;

export interface PlanBadgeController {
  id: (typeof PLAN_IDS)[number];
}

export function usePlanBadgeController(): PlanBadgeController {
  const { execute, result } = useAction(getMyPlanAction);

  useEffect(() => {
    execute();
  }, [execute]);

  const id = PLAN_IDS.find((plan) => plan === result.data?.plan) ?? "free";
  return { id };
}
