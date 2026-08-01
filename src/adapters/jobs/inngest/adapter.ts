import { executeAdapterOperation, type JobAdapter } from "@/core/services";
import { trackJobFailure } from "@/lib/telemetry/failures";

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
      const startTime = Date.now();
      try {
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
      } catch (error) {
        trackJobFailure({
          durationMs: Date.now() - startTime,
          failureClass: "exception",
          jobName: input.name,
          phase: "dispatch",
          provider,
          ...(error instanceof Error && "retryable" in error
            ? {
                retryable: Boolean(
                  (error as { retryable?: unknown }).retryable
                ),
              }
            : {}),
        });
        throw error;
      }
    },
  };
}
