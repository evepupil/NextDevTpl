"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * Cookie 存储键名 - 与 CookieConsent 组件保持一致
 */
const COOKIE_CONSENT_KEY = "cookie-consent";

/**
 * Analytics 组件
 *
 * 功能:
 * - 条件渲染 Google Analytics
 * - 仅在用户接受 Cookie 时加载
 * - 监听 localStorage 变化以响应用户偏好更改
 */
export function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    // 检查初始同意状态
    const checkConsent = () => {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      setHasConsent(consent === "all");
    };

    checkConsent();

    // 监听 storage 事件以响应其他标签页的更改
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) {
        checkConsent();
      }
    };

    // 监听自定义事件以响应同一页面的更改
    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cookie-consent-change", handleConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cookie-consent-change", handleConsentChange);
    };
  }, []);

  // 未配置 GA ID 或未同意时不渲染
  if (!gaId || !hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
