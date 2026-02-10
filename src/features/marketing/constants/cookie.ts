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
  /** 分析 Cookie */
  analytics: boolean;
  /** 营销 Cookie */
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
