"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { getMyCreditsBalance } from "@/features/credits/actions";

import type { BalanceBadgeController } from "./contracts";

export type { BalanceBadgeController } from "./contracts";

export function useBalanceBadgeController(): BalanceBadgeController {
  const { execute, result, isPending } = useAction(getMyCreditsBalance);

  useEffect(() => {
    execute();
  }, [execute]);

  return { balance: result.data?.balance ?? 0, isPending };
}
