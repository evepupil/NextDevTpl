export type AdapterErrorCode =
  | "authentication"
  | "configuration"
  | "invalid_request"
  | "not_found"
  | "rate_limited"
  | "remote_failure"
  | "signature_invalid"
  | "unsupported";

export interface AdapterDescriptor<
  Provider extends string,
  Capabilities extends object,
> {
  provider: Provider;
  capabilities: Readonly<Capabilities>;
}

export class AdapterError extends Error {
  readonly code: AdapterErrorCode;
  readonly provider: string;
  readonly retryable: boolean;

  constructor(params: {
    code: AdapterErrorCode;
    message: string;
    provider: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(
      params.message,
      params.cause === undefined ? undefined : { cause: params.cause }
    );
    this.name = "AdapterError";
    this.code = params.code;
    this.provider = params.provider;
    this.retryable = params.retryable ?? false;
  }
}

export function sanitizeAdapterMessage(
  message: string,
  secrets: readonly (string | undefined)[]
): string {
  return secrets.reduce<string>(
    (sanitized, secret) =>
      secret ? sanitized.replaceAll(secret, "[REDACTED]") : sanitized,
    message
  );
}

export function toAdapterError(params: {
  code?: AdapterErrorCode;
  error: unknown;
  fallbackMessage: string;
  provider: string;
  retryable?: boolean;
  secrets?: readonly (string | undefined)[];
}): AdapterError {
  if (params.error instanceof AdapterError) {
    return params.error;
  }

  const rawMessage =
    params.error instanceof Error
      ? params.error.message
      : params.fallbackMessage;
  const message = sanitizeAdapterMessage(rawMessage, params.secrets ?? []);

  const errorParams = {
    code: params.code ?? "remote_failure",
    message: message || params.fallbackMessage,
    provider: params.provider,
    cause: params.error,
  };

  return new AdapterError(
    params.retryable === undefined
      ? errorParams
      : { ...errorParams, retryable: params.retryable }
  );
}

export async function executeAdapterOperation<T>(params: {
  operation: () => Promise<T>;
  provider: string;
  fallbackMessage: string;
  retryable?: boolean;
  secrets?: readonly (string | undefined)[];
}): Promise<T> {
  try {
    return await params.operation();
  } catch (error) {
    throw toAdapterError({
      error,
      fallbackMessage: params.fallbackMessage,
      provider: params.provider,
      ...(params.retryable === undefined
        ? {}
        : { retryable: params.retryable }),
      ...(params.secrets ? { secrets: params.secrets } : {}),
    });
  }
}

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };
