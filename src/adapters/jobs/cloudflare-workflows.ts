import {
  AdapterError,
  executeAdapterOperation,
  type JobAdapter,
  type JsonObject,
} from "@/core/services";

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
        throw new AdapterError({
          code: "configuration",
          message: `Workflow binding is not configured for ${input.name}`,
          provider,
        });
      }
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
    },
  };
}
