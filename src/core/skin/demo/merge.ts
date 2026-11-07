import { parseDemoDataPatch, validateDemoData } from "./schema.js";
import type { DemoData, DemoDataPatch } from "./types.js";

export function mergeDemoData(base: DemoData, patch: DemoDataPatch): DemoData {
  const validatedBase = validateDemoData(base);
  const validatedPatch = parseDemoDataPatch(patch);
  const userPatch = validatedPatch.workspace?.user;
  const planPatch = validatedPatch.workspace?.plan;
  const creditsPatch = validatedPatch.workspace?.credits;

  return validateDemoData({
    schemaVersion: 1,
    snapshotAt: validatedPatch.snapshotAt ?? validatedBase.snapshotAt,
    workspace: {
      user: { ...validatedBase.workspace.user, ...userPatch },
      plan: { ...validatedBase.workspace.plan, ...planPatch },
      credits: {
        balance:
          creditsPatch?.balance ?? validatedBase.workspace.credits.balance,
        totalEarned:
          creditsPatch?.totalEarned ??
          validatedBase.workspace.credits.totalEarned,
        totalSpent:
          creditsPatch?.totalSpent ??
          validatedBase.workspace.credits.totalSpent,
        batches:
          creditsPatch?.batches ?? validatedBase.workspace.credits.batches,
        transactions:
          creditsPatch?.transactions ??
          validatedBase.workspace.credits.transactions,
      },
      billingHistory:
        validatedPatch.workspace?.billingHistory ??
        validatedBase.workspace.billingHistory,
    },
    support: {
      tickets: validatedPatch.support?.tickets ?? validatedBase.support.tickets,
    },
  });
}
