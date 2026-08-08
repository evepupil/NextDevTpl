"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/routing";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_KEY,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";
import { trackPageView } from "@/lib/telemetry/client";

function clearGoogleAnalytics(gaId: string | undefined): void {
  if (gaId) {
    const windowWithAnalytics = window as Window & Record<string, unknown>;
    windowWithAnalytics[`ga-disable-${gaId}`] = true;
  }

  document
    .querySelectorAll<HTMLScriptElement>("#_next-ga, #_next-ga-init")
    .forEach((script) => {
      script.remove();
    });

  const dataLayer = window as Window & { dataLayer?: unknown[] };
  if (dataLayer.dataLayer) {
    dataLayer.dataLayer.length = 0;
  }
  delete (window as Window & { gtag?: unknown }).gtag;

  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=", 1)[0]?.trim();
    if (!name || !/^_(?:ga|gid|gat)/.test(name)) {
      continue;
    }
    // biome-ignore lint/suspicious/noDocumentCookie: 需要清理 GA 已写入的浏览器 Cookie。
    document.cookie = `${name}=; Max-Age=0; path=/`;
    if (location.hostname.includes(".")) {
      // biome-ignore lint/suspicious/noDocumentCookie: 需要覆盖当前域名下的 GA Cookie。
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
      // biome-ignore lint/suspicious/noDocumentCookie: 需要覆盖父域名下的 GA Cookie。
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}`;
    }
  }
}

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
  const pathname = usePathname();

  useEffect(() => {
    // 检查初始同意状态
    const checkConsent = () => {
      setHasConsent(hasAnalyticsConsent());
    };

    checkConsent();

    // 监听 storage 事件以响应其他标签页的更改
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY || e.key === COOKIE_PREFERENCES_KEY) {
        checkConsent();
      }
    };

    // 监听自定义事件以响应同一页面的更改
    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        COOKIE_CONSENT_CHANGE_EVENT,
        handleConsentChange
      );
    };
  }, []);

  useEffect(() => {
    if (hasConsent) {
      if (gaId) {
        const windowWithAnalytics = window as Window & Record<string, unknown>;
        windowWithAnalytics[`ga-disable-${gaId}`] = false;
      }
      return;
    }

    clearGoogleAnalytics(gaId);
  }, [gaId, hasConsent]);

  useEffect(() => {
    if (hasConsent) trackPageView(pathname);
  }, [hasConsent, pathname]);

  // 未配置 GA ID 或未同意时不渲染
  if (!gaId || !hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
