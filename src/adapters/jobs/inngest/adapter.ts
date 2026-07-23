import { executeAdapterOperation, type JobAdapter } from "@/core/services";

import { inngest } from "./client";

export function createInngestJobAdapter(): JobAdapter {
  const provider = "inngest" as const;

  return {
    provider,
    capabilities: {
      durableSteps: true,
      events: true,
      scheduling: true,
    },

    async dispatch(input) {
      const result = await executeAdapterOperation({
        provider,
        fallbackMessage: "Inngest event dispatch failed",
        operation: () =>
          inngest.send({
            name: input.name,
            data: input.payload,
          }),
      });
      return { id: result.ids[0] ?? input.id ?? crypto.randomUUID() };
    },
  };
}
