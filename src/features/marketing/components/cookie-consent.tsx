"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_PREFERENCES_KEY,
  type CookieConsentType,
  type CookiePreferences,
} from "@/features/marketing/constants";

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
 * - 支持 i18n 国际化
 */
export function CookieConsent() {
  const t = useTranslations("Cookie");

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
                <h3 className="text-lg font-semibold">{t("title")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("description")}
                  <Link
                    href="/legal/privacy"
                    className="ml-1 underline underline-offset-4 hover:text-foreground"
                  >
                    {t("privacyPolicy")}
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
                  {t("managePreferences")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  {t("rejectAll")}
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleAcceptAll}
                >
                  {t("acceptAll")}
                </Button>
              </div>
            </div>
          ) : (
            // 详细设置视图
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("preferencesTitle")}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  {t("back")}
                </Button>
              </div>

              <div className="space-y-3">
                {/* 必要 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{t("essential.title")}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("essential.description")}
                    </p>
                  </div>
                  <div className="ml-4 text-sm text-muted-foreground">
                    {t("alwaysEnabled")}
                  </div>
                </div>

                {/* 分析 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{t("analytics.title")}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("analytics.description")}
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
                    <h4 className="font-medium">{t("marketing.title")}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("marketing.description")}
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
                  {t("rejectAll")}
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleSavePreferences}
                >
                  {t("saveSettings")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
