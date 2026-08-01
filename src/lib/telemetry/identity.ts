import type { TelemetryContext, TelemetryUtm } from "@/core/services";

export const TELEMETRY_ANONYMOUS_ID_COOKIE = "nextdevtpl_anonymous_id";
export const TELEMETRY_ATTRIBUTION_COOKIE = "nextdevtpl_attribution";
export const TELEMETRY_ANONYMOUS_ID_HEADER = "x-nextdevtpl-anonymous-id";
export const TELEMETRY_ATTRIBUTION_HEADER = "x-nextdevtpl-attribution";
export const TELEMETRY_LOCALE_HEADER = "x-nextdevtpl-locale";
export const TELEMETRY_REQUEST_ID_HEADER = "x-request-id";

const ANONYMOUS_ID_STORAGE_KEY = "nextdevtpl.anonymous_id";
const ATTRIBUTION_STORAGE_KEY = "nextdevtpl.attribution";
const MAX_VALUE_LENGTH = 128;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface TelemetryAttributionState {
  initialSource?: string;
  latestSource?: string;
  utm?: TelemetryUtm;
}

export interface TelemetryRequestContext {
  getCookie?: ((name: string) => string | null) | undefined;
  headers?: Headers | undefined;
}

export function normalizeTelemetryValue(
  value: unknown,
  maxLength = MAX_VALUE_LENGTH
): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = Array.from(value)
    .filter((character) => {
      const codePoint = character.charCodeAt(0);
      return codePoint >= 32 && codePoint !== 127;
    })
    .join("")
    .trim()
    .slice(0, maxLength);
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeTelemetryIdentifier(
  value: unknown
): string | undefined {
  const normalized = normalizeTelemetryValue(value);
  if (!normalized || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function normalizeUtm(value: unknown): string | undefined {
  return normalizeTelemetryValue(value);
}

function normalizeUtmState(value: unknown): TelemetryUtm | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const campaign = normalizeUtm(record.campaign);
  const content = normalizeUtm(record.content);
  const medium = normalizeUtm(record.medium);
  const source = normalizeUtm(record.source);
  const term = normalizeUtm(record.term);
  const utm: TelemetryUtm = {
    ...(campaign ? { campaign } : {}),
    ...(content ? { content } : {}),
    ...(medium ? { medium } : {}),
    ...(source ? { source } : {}),
    ...(term ? { term } : {}),
  };

  return Object.keys(utm).length > 0 ? utm : undefined;
}

export function parseTelemetryAttribution(
  value: unknown
): TelemetryAttributionState | undefined {
  if (typeof value !== "string" || value.length > 2048) return undefined;

  try {
    const decoded = decodeURIComponent(value);
    const parsed: unknown = JSON.parse(decoded);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return undefined;
    }

    const record = parsed as Record<string, unknown>;
    const initialSource = normalizeTelemetryValue(record.initialSource);
    const latestSource = normalizeTelemetryValue(record.latestSource);
    const utm = normalizeUtmState(record.utm);
    if (!initialSource && !latestSource && !utm) return undefined;

    return {
      ...(initialSource ? { initialSource } : {}),
      ...(latestSource ? { latestSource } : {}),
      ...(utm ? { utm } : {}),
    };
  } catch {
    return undefined;
  }
}

export function serializeTelemetryAttribution(
  attribution: TelemetryAttributionState
): string | undefined {
  if (
    !attribution.initialSource &&
    !attribution.latestSource &&
    !attribution.utm
  ) {
    return undefined;
  }

  const value = encodeURIComponent(JSON.stringify(attribution));
  return value.length <= 2048 ? value : undefined;
}

function getHeader(headers: Headers | undefined, name: string): string | null {
  return headers?.get(name) ?? null;
}

function readCookieHeader(
  headers: Headers | undefined,
  name: string
): string | null {
  const cookieHeader = headers?.get("cookie");
  if (!cookieHeader) return null;

  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      return item.slice(separator + 1).trim();
    }
  }
  return null;
}

function readRequestCookie(
  request: TelemetryRequestContext,
  name: string
): string | null {
  return request.getCookie?.(name) ?? readCookieHeader(request.headers, name);
}

export function getTelemetryContextFromRequest(
  request: TelemetryRequestContext,
  identity?: { userId?: string; sessionId?: string }
): TelemetryContext {
  const anonymousId = normalizeTelemetryIdentifier(
    getHeader(request.headers, TELEMETRY_ANONYMOUS_ID_HEADER) ??
      readRequestCookie(request, TELEMETRY_ANONYMOUS_ID_COOKIE)
  );
  const attribution =
    parseTelemetryAttribution(
      getHeader(request.headers, TELEMETRY_ATTRIBUTION_HEADER) ??
        readRequestCookie(request, TELEMETRY_ATTRIBUTION_COOKIE)
    ) ?? {};
  const userId = normalizeTelemetryIdentifier(identity?.userId);
  const sessionId = normalizeTelemetryIdentifier(identity?.sessionId);
  const locale = normalizeTelemetryValue(
    getHeader(request.headers, TELEMETRY_LOCALE_HEADER) ??
      getHeader(request.headers, "accept-language")?.split(",", 1)[0],
    16
  );
  const requestId = normalizeTelemetryIdentifier(
    getHeader(request.headers, TELEMETRY_REQUEST_ID_HEADER)
  );

  const telemetryContext: TelemetryContext = {
    ...(attribution.initialSource
      ? { initialSource: attribution.initialSource }
      : {}),
    ...(attribution.latestSource
      ? { latestSource: attribution.latestSource }
      : {}),
    ...(locale ? { locale } : {}),
    ...(requestId ? { requestId } : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(attribution.utm ? { utm: attribution.utm } : {}),
  };

  if (anonymousId || userId) {
    telemetryContext.identity = {
      ...(anonymousId ? { anonymousId } : {}),
      ...(userId ? { userId } : {}),
    };
  }

  return telemetryContext;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const encodedName = encodeURIComponent(name);
  try {
    for (const item of document.cookie.split(";")) {
      const separator = item.indexOf("=");
      if (separator < 0 || item.slice(0, separator).trim() !== encodedName) {
        continue;
      }
      return item.slice(separator + 1).trim();
    }
  } catch {
    return null;
  }
  return null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: The identity cookie is intentionally first-party and client-readable.
    document.cookie = `${encodeURIComponent(name)}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // 浏览器禁用 Cookie 时仍允许业务请求继续执行。
  }
}

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readLocalStorage(key: string): string | null {
  try {
    return getLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    getLocalStorage()?.setItem(key, value);
  } catch {
    // 浏览器禁用本地存储时由 Cookie 作为降级路径。
  }
}

function getStoredAttribution(): TelemetryAttributionState {
  if (typeof window === "undefined") return {};

  const stored = parseTelemetryAttribution(
    readLocalStorage(ATTRIBUTION_STORAGE_KEY) ?? ""
  );
  if (stored) return stored;

  return (
    parseTelemetryAttribution(getCookie(TELEMETRY_ATTRIBUTION_COOKIE) ?? "") ??
    {}
  );
}

function getReferrerHost(
  referrer: string | undefined,
  currentUrl: URL
): string | undefined {
  if (!referrer) return undefined;
  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.origin === currentUrl.origin) return undefined;
    return normalizeTelemetryValue(referrerUrl.hostname, MAX_VALUE_LENGTH);
  } catch {
    return undefined;
  }
}

export function createTelemetryAttribution(input: {
  previous?: TelemetryAttributionState;
  referrer?: string;
  url: string;
}): TelemetryAttributionState {
  const currentUrl = new URL(input.url, "https://nextdevtpl.local");
  const previous = input.previous ?? {};
  const utmParams = new URLSearchParams(currentUrl.search);
  const campaign = normalizeUtm(utmParams.get("utm_campaign"));
  const content = normalizeUtm(utmParams.get("utm_content"));
  const medium = normalizeUtm(utmParams.get("utm_medium"));
  const source = normalizeUtm(utmParams.get("utm_source"));
  const term = normalizeUtm(utmParams.get("utm_term"));
  const utm: TelemetryUtm = {
    ...(campaign ? { campaign } : {}),
    ...(content ? { content } : {}),
    ...(medium ? { medium } : {}),
    ...(source ? { source } : {}),
    ...(term ? { term } : {}),
  };
  const hasUtm = Object.keys(utm).length > 0;
  const referrerHost = getReferrerHost(input.referrer, currentUrl);
  const sourceSignal = normalizeTelemetryValue(utm.source ?? referrerHost);
  const latestSource = sourceSignal ?? previous.latestSource ?? "direct";

  return {
    initialSource: previous.initialSource ?? latestSource,
    latestSource,
    ...(hasUtm ? { utm } : previous.utm ? { utm: previous.utm } : {}),
  };
}

function getOrCreateAnonymousId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = normalizeTelemetryIdentifier(
    readLocalStorage(ANONYMOUS_ID_STORAGE_KEY) ??
      getCookie(TELEMETRY_ANONYMOUS_ID_COOKIE)
  );
  if (stored) return stored;

  const generated =
    typeof crypto.randomUUID === "function"
      ? `anon_${crypto.randomUUID()}`
      : `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const anonymousId = normalizeTelemetryIdentifier(generated);
  if (!anonymousId) return undefined;

  writeLocalStorage(ANONYMOUS_ID_STORAGE_KEY, anonymousId);
  setCookie(TELEMETRY_ANONYMOUS_ID_COOKIE, anonymousId);
  return anonymousId;
}

export function initializeTelemetryIdentity(): void {
  if (typeof window === "undefined") return;

  const attribution = createTelemetryAttribution({
    previous: getStoredAttribution(),
    referrer: document.referrer,
    url: window.location.href,
  });
  const serialized = serializeTelemetryAttribution(attribution);
  if (serialized) {
    writeLocalStorage(ATTRIBUTION_STORAGE_KEY, serialized);
    setCookie(TELEMETRY_ATTRIBUTION_COOKIE, serialized);
  }
  getOrCreateAnonymousId();
}

export function getClientTelemetryHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    initializeTelemetryIdentity();

    const anonymousId = normalizeTelemetryIdentifier(
      readLocalStorage(ANONYMOUS_ID_STORAGE_KEY) ??
        getCookie(TELEMETRY_ANONYMOUS_ID_COOKIE)
    );
    const attribution = serializeTelemetryAttribution(getStoredAttribution());
    const locale = normalizeTelemetryValue(document.documentElement.lang, 16);
    const headers: Record<string, string> = {};

    if (anonymousId) headers[TELEMETRY_ANONYMOUS_ID_HEADER] = anonymousId;
    if (attribution) headers[TELEMETRY_ATTRIBUTION_HEADER] = attribution;
    if (locale) headers[TELEMETRY_LOCALE_HEADER] = locale;
    return headers;
  } catch {
    return {};
  }
}
