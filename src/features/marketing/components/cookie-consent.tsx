"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_PREFERENCES_KEY,
  type CookieConsentType,
  type CookiePreferences,
} from "@/features/marketing/constants";

/**
 * 多语言文本
 */
const translations = {
  en: {
    title: "Cookie Settings",
    description:
      "We use cookies to ensure you get the best experience on our website. By continuing to use this site, you agree to our",
    privacyPolicy: "Privacy Policy",
    managePreferences: "Manage Preferences",
    essentialOnly: "Essential Only",
    acceptAll: "Accept All",
    preferencesTitle: "Cookie Preferences",
    back: "Back",
    essentialCookies: "Essential Cookies",
    essentialDescription:
      "These cookies are necessary for the website to function and cannot be disabled.",
    alwaysEnabled: "Always enabled",
    analyticsCookies: "Analytics Cookies",
    analyticsDescription:
      "Help us understand how visitors interact with the website to improve user experience.",
    marketingCookies: "Marketing Cookies",
    marketingDescription:
      "Used to show you relevant ads and marketing content.",
    saveSettings: "Save Settings",
  },
  zh: {
    title: "Cookie 设置",
    description:
      "我们使用 Cookie 来确保您在我们网站上获得最佳体验。继续使用本网站即表示您同意我们的",
    privacyPolicy: "隐私政策",
    managePreferences: "管理偏好",
    essentialOnly: "仅必要",
    acceptAll: "接受全部",
    preferencesTitle: "Cookie 偏好设置",
    back: "返回",
    essentialCookies: "必要 Cookie",
    essentialDescription:
      "这些 Cookie 是网站正常运行所必需的，无法关闭。",
    alwaysEnabled: "始终启用",
    analyticsCookies: "分析 Cookie",
    analyticsDescription:
      "帮助我们了解访问者如何与网站互动，以便改进用户体验。",
    marketingCookies: "营销 Cookie",
    marketingDescription: "用于向您展示相关广告和营销内容。",
    saveSettings: "保存设置",
  },
} as const;

/**
 * 默认 Cookie 偏好
 */
const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: true,
  marketing: true,
};

/**
 * Cookie Consent Banner 组件
 *
 * 功能:
 * - 首次访问时显示 Cookie 同意横幅
 * - 用户可选择接受全部、仅必要或管理偏好
 * - 选择后存储到 localStorage
 * - 支持动画过渡效果
 * - 跟踪用户的具体偏好设置
 * - 支持多语言 (中英文)
 */
export function CookieConsent() {
  const locale = useLocale() as "en" | "zh";
  const t = translations[locale] || translations.en;

  // 是否显示横幅
  const [isVisible, setIsVisible] = useState(false);
  // 是否显示详细设置面板
  const [showDetails, setShowDetails] = useState(false);
  // Cookie 偏好设置
  const [preferences, setPreferences] =
    useState<CookiePreferences>(DEFAULT_PREFERENCES);

  /**
   * 检查是否已有 Cookie 同意记录
   */
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // 延迟显示，避免页面加载时闪烁
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    // 加载已保存的偏好设置
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch {
        // 忽略解析错误
      }
    }
    return undefined;
  }, []);

  /**
   * 保存 Cookie 同意设置
   */
  const saveConsent = useCallback(
    (consent: CookieConsentType, prefs?: CookiePreferences) => {
      localStorage.setItem(COOKIE_CONSENT_KEY, consent || "");
      if (prefs) {
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
      }
      // 触发自定义事件通知 Analytics 组件
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT));
      setIsVisible(false);
    },
    []
  );

  /**
   * 处理接受全部 Cookie
   */
  const handleAcceptAll = useCallback(() => {
    const allPreferences: CookiePreferences = {
      analytics: true,
      marketing: true,
    };
    setPreferences(allPreferences);
    saveConsent("all", allPreferences);
  }, [saveConsent]);

  /**
   * 处理仅接受必要 Cookie
   */
  const handleRejectAll = useCallback(() => {
    const essentialPreferences: CookiePreferences = {
      analytics: false,
      marketing: false,
    };
    setPreferences(essentialPreferences);
    saveConsent("essential", essentialPreferences);
  }, [saveConsent]);

  /**
   * 处理保存当前偏好设置
   */
  const handleSavePreferences = useCallback(() => {
    // 根据偏好确定同意类型
    const consentType: CookieConsentType =
      preferences.analytics || preferences.marketing ? "all" : "essential";
    saveConsent(consentType, preferences);
  }, [preferences, saveConsent]);

  /**
   * 更新偏好设置
   */
  const updatePreference = useCallback(
    (key: keyof CookiePreferences, value: boolean) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // 不显示时返回 null
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
    >
      <div className="container">
        <div className="rounded-lg border bg-background p-6 shadow-lg">
          {!showDetails ? (
            // 简洁视图
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.description}
                  <Link
                    href="/legal/privacy"
                    className="ml-1 underline underline-offset-4 hover:text-foreground"
                  >
                    {t.privacyPolicy}
                  </Link>
                  。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                >
                  {t.managePreferences}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  {t.essentialOnly}
                </Button>
                <Button size="sm" onClick={handleAcceptAll}>
                  {t.acceptAll}
                </Button>
              </div>
            </div>
          ) : (
            // 详细设置视图
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.preferencesTitle}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  {t.back}
                </Button>
              </div>

              <div className="space-y-3">
                {/* 必要 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{t.essentialCookies}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.essentialDescription}
                    </p>
                  </div>
                  <div className="ml-4 text-sm text-muted-foreground">
                    {t.alwaysEnabled}
                  </div>
                </div>

                {/* 分析 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{t.analyticsCookies}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.analyticsDescription}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={preferences.analytics}
                      onCheckedChange={(checked) =>
                        updatePreference("analytics", checked)
                      }
                    />
                  </div>
                </div>

                {/* 营销 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{t.marketingCookies}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.marketingDescription}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={preferences.marketing}
                      onCheckedChange={(checked) =>
                        updatePreference("marketing", checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  {t.essentialOnly}
                </Button>
                <Button size="sm" onClick={handleSavePreferences}>
                  {t.saveSettings}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
