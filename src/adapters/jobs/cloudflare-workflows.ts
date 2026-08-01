import {
  AdapterError,
  executeAdapterOperation,
  type JobAdapter,
  type JsonObject,
} from "@/core/services";
import { trackJobFailure } from "@/lib/telemetry/failures";

export interface WorkflowBindingPort {
  create(input: { id?: string; params: JsonObject }): Promise<{ id: string }>;
}

export function createCloudflareWorkflowsAdapter(
  workflows: Readonly<Record<string, WorkflowBindingPort>>
): JobAdapter {
  const provider = "cloudflare-workflows" as const;

  return {
    provider,
    capabilities: {
      durableSteps: true,
      events: true,
      scheduling: true,
    },

    async dispatch(input) {
      const workflow = workflows[input.name];
      if (!workflow) {
        trackJobFailure({
          failureClass: "exception",
          jobName: input.name,
          phase: "dispatch",
          provider,
        });
        throw new AdapterError({
          code: "configuration",
          message: `Workflow binding is not configured for ${input.name}`,
          provider,
        });
      }
      try {
        const instance = await executeAdapterOperation({
          provider,
          fallbackMessage: "Cloudflare Workflow dispatch failed",
          operation: () =>
            workflow.create({
              params: input.payload,
              ...(input.id ? { id: input.id } : {}),
            }),
        });
        return { id: instance.id };
      } catch (error) {
        trackJobFailure({
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
