/**
 * Cookie 同意相关常量
 *
 * 集中管理 Cookie 同意功能的常量，确保类型安全
 */

/**
 * Cookie 同意类型
 */
export type CookieConsentType = "all" | "essential" | null;

/**
 * Cookie 偏好设置
 */
export interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
}

/**
 * localStorage 存储键名
 */
export const COOKIE_CONSENT_KEY = "cookie-consent";

/**
 * Cookie 偏好存储键名
 */
export const COOKIE_PREFERENCES_KEY = "cookie-preferences";

/**
 * Cookie 同意变更事件名
 */
export const COOKIE_CONSENT_CHANGE_EVENT = "cookie-consent-change";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (window.localStorage.getItem(COOKIE_CONSENT_KEY) !== "all") {
      return false;
    }

    const raw = window.localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!raw) return true;

    const parsed: unknown = JSON.parse(raw);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { analytics?: unknown }).analytics !== false
    );
  } catch {
    return false;
  }
}
