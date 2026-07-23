import {
  AdapterError,
  executeAdapterOperation,
  type RateLimitAdapter,
} from "@/core/services";

export interface CloudflareRateLimitBindingPort {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export function createCloudflareRateLimitAdapter(
  bindings: Readonly<Record<string, CloudflareRateLimitBindingPort>>
): RateLimitAdapter {
  const provider = "cloudflare-rate-limit" as const;

  return {
    provider,
    capabilities: { dynamicRules: false, preciseMetadata: false },
    async limit(input) {
      const binding = bindings[input.namespace];
      if (!binding) {
        throw new AdapterError({
          code: "configuration",
          message: `Rate Limiting binding is not configured for ${input.namespace}`,
          provider,
        });
      }
      const result = await executeAdapterOperation({
        provider,
        fallbackMessage: "Cloudflare rate limit check failed",
        operation: () => binding.limit({ key: input.identifier }),
      });
      return {
        success: result.success,
        remaining: null,
        reset: null,
        limit: input.limit,
        skipped: false,
      };
    },
  };
}
