"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Cookie 同意类型
 */
type CookieConsent = "all" | "essential" | null;

/**
 * Cookie 存储键名
 */
const COOKIE_CONSENT_KEY = "cookie-consent";

/**
 * Cookie Consent Banner 组件
 *
 * 功能:
 * - 首次访问时显示 Cookie 同意横幅
 * - 用户可选择接受全部、仅必要或管理偏好
 * - 选择后存储到 localStorage
 * - 支持动画过渡效果
 */
export function CookieConsent() {
  // 是否显示横幅
  const [isVisible, setIsVisible] = useState(false);
  // 是否显示详细设置面板
  const [showDetails, setShowDetails] = useState(false);

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
    return undefined;
  }, []);

  /**
   * 处理接受全部 Cookie
   */
  const handleAcceptAll = () => {
    saveConsent("all");
  };

  /**
   * 处理仅接受必要 Cookie
   */
  const handleRejectAll = () => {
    saveConsent("essential");
  };

  /**
   * 保存 Cookie 同意设置
   */
  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent || "");
    // 触发自定义事件通知 Analytics 组件
    window.dispatchEvent(new CustomEvent("cookie-consent-change"));
    setIsVisible(false);
  };

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
                <h3 className="text-lg font-semibold">Cookie 设置</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  我们使用 Cookie 来确保您在我们网站上获得最佳体验。继续使用本网站即表示您同意我们的
                  <a
                    href="/privacy"
                    className="ml-1 underline underline-offset-4 hover:text-foreground"
                  >
                    隐私政策
                  </a>
                  。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                >
                  管理偏好
                </Button>
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  仅必要
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleAcceptAll}
                >
                  接受全部
                </Button>
              </div>
            </div>
          ) : (
            // 详细设置视图
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cookie 偏好设置</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  返回
                </Button>
              </div>

              <div className="space-y-3">
                {/* 必要 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">必要 Cookie</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      这些 Cookie 是网站正常运行所必需的，无法关闭。
                    </p>
                  </div>
                  <div className="ml-4 text-sm text-muted-foreground">
                    始终启用
                  </div>
                </div>

                {/* 分析 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">分析 Cookie</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      帮助我们了解访问者如何与网站互动，以便改进用户体验。
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                {/* 营销 Cookie */}
                <div className="flex items-start justify-between rounded-md border p-4">
                  <div className="flex-1">
                    <h4 className="font-medium">营销 Cookie</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      用于向您展示相关广告和营销内容。
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  仅必要
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleAcceptAll}
                >
                  保存设置
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
