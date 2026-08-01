const MAX_REDACTION_DEPTH = 8;
const sensitiveKeyPattern =
  /(?:password|passcode|secret|authorization|cookie|apikey|email|prompt|content|uploadcontent|filecontent|filename)/i;

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9]/g, "");
  return sensitiveKeyPattern.test(normalized) || normalized.endsWith("token");
}

export function redactText(value: string): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(
      /((?:https?|postgres(?:ql)?):\/\/)[^\s/@:]+:[^\s/@]+@/giu,
      "$1[REDACTED]@"
    )
    .replace(
      /([?&](?:token|secret|password|apikey|api_key|authorization|email)=)[^&\s]+/giu,
      "$1[REDACTED]"
    )
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
      "[REDACTED_EMAIL]"
    );
}

function redactErrorValue(error: Error, depth: number, seen: WeakSet<object>) {
  const result: Record<string, unknown> = {
    message: redactText(error.message),
    name: redactText(error.name),
  };
  if (error.stack) result.stack = redactText(error.stack);
  if ("cause" in error) {
    result.cause = redactValue(error.cause, depth + 1, seen);
  }
  return result;
}

export function redactValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (depth > MAX_REDACTION_DEPTH) return "[REDACTED_DEPTH]";
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }
  if (typeof value === "string") return redactText(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "undefined") return undefined;
  if (value instanceof Error) return redactErrorValue(value, depth, seen);
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return "[REDACTED]";
  if (seen.has(value)) return "[REDACTED_CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => redactValue(item, depth + 1, seen))
      .filter((item) => item !== undefined);
  }

  const result: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitiveKey(key)) continue;
    const redacted = redactValue(nestedValue, depth + 1, seen);
    if (redacted !== undefined) result[key] = redacted;
  }
  return result;
}

export function redactRecord(
  value: Record<string, unknown>
): Record<string, unknown> {
  const redacted = redactValue(value);
  return redacted && typeof redacted === "object" && !Array.isArray(redacted)
    ? (redacted as Record<string, unknown>)
    : {};
}

export function redactError(error: unknown): unknown {
  return error instanceof Error
    ? redactErrorValue(error, 0, new WeakSet())
    : redactValue(error);
}
