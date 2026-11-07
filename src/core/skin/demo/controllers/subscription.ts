"use client";

import type { PlanBadgeController } from "@/features/subscription/view";

import { useDemoStore } from "../store.js";

export function usePlanBadgeController(): PlanBadgeController {
  const { state } = useDemoStore();
  return { id: state.data.workspace.plan.id };
}
