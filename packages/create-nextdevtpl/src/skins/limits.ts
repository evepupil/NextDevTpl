import { failSkin } from "./errors.js";

export interface SkinSourceLimits {
  timeoutMs: number;
  maxDownloadBytes: number;
  maxExtractedBytes: number;
  maxFileBytes: number;
  maxEntries: number;
}

export const DEFAULT_SKIN_SOURCE_LIMITS: Readonly<SkinSourceLimits> = {
  timeoutMs: 60_000,
  maxDownloadBytes: 32 * 1024 * 1024,
  maxExtractedBytes: 128 * 1024 * 1024,
  maxFileBytes: 16 * 1024 * 1024,
  maxEntries: 4096,
};

export function resolveSkinSourceLimits(
  overrides?: Partial<SkinSourceLimits>
): SkinSourceLimits {
  const limits = { ...DEFAULT_SKIN_SOURCE_LIMITS, ...overrides };

  for (const [name, value] of Object.entries(limits)) {
    const maximum = DEFAULT_SKIN_SOURCE_LIMITS[name as keyof SkinSourceLimits];
    if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
      failSkin([
        `${name} must be a positive integer no greater than its default`,
      ]);
    }
  }

  return limits;
}
