"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_PREFERENCES_KEY,
  type CookieConsentType,
  type CookiePreferences,
} from "@/features/marketing/constants";

/**
 * Cookie 类别配置
 */
const cookieCategories = [
  {
    id: "necessary",
    title: "Strictly Necessary",
    description:
      "These cookies are essential for the proper functioning of the website and cannot be disabled.",
    required: true,
  },
  {
    id: "analytics",
    title: "Analytics and Performance",
    description:
      "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.",
    required: false,
  },
  {
    id: "marketing",
    title: "Targeting and Advertising",
    description:
      "These cookies are used to make advertising messages more relevant to you and your interests. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.",
    required: false,
  },
];

/**
 * 默认 Cookie 偏好
 */
const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: true,
  marketing: true,
};

/**
 * Cookie Settings Dialog 组件属性
 */
interface CookieSettingsDialogProps {
  /** 触发按钮的子元素 */
  children: React.ReactNode;
}

/**
 * Cookie Settings Dialog 组件
 *
 * 功能:
 * - 显示 Cookie 偏好设置对话框
 * - 可展开的 Cookie 类别
 * - 支持 Accept all / Reject all / Accept current selection
 */
export function CookieSettingsDialog({ children }: CookieSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [expandedItems, setExpandedItems] = useState<string[]>(["necessary"]);

  /**
   * 加载已保存的偏好设置
   */
  useEffect(() => {
    if (open) {
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        try {
          setPreferences(JSON.parse(savedPreferences));
        } catch {
          // 忽略解析错误
        }
      }
    }
  }, [open]);

  /**
   * 切换展开状态
   */
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  /**
   * 保存 Cookie 同意设置
   */
  const saveConsent = useCallback(
    (consent: CookieConsentType, prefs: CookiePreferences) => {
      localStorage.setItem(COOKIE_CONSENT_KEY, consent || "");
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
      // 触发自定义事件通知 Analytics 组件
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT));
      setOpen(false);
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
   * 处理拒绝全部（仅必要）
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
   * 处理保存当前选择
   */
  const handleSavePreferences = useCallback(() => {
    const consentType: CookieConsentType =
      preferences.analytics || preferences.marketing ? "all" : "essential";
    saveConsent(consentType, preferences);
  }, [preferences, saveConsent]);

  /**
   * 更新偏好设置
   */
  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * 获取某个类别的开关状态
   */
  const getCategoryValue = (id: string): boolean => {
    if (id === "necessary") return true;
    if (id === "analytics") return preferences.analytics;
    if (id === "marketing") return preferences.marketing;
    return false;
  };

  /**
   * 处理某个类别的开关变化
   */
  const handleCategoryChange = (id: string, value: boolean) => {
    if (id === "analytics") updatePreference("analytics", value);
    if (id === "marketing") updatePreference("marketing", value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0 [&>button]:hidden" overlayClassName="bg-black/30">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Manage cookie preferences
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {/* Description */}
          <div className="mb-6">
            <h3 className="mb-2 font-semibold">Your Privacy Choices</h3>
            <p className="text-sm text-muted-foreground">
              In this panel you can express some preferences related to the
              processing of your personal information. You may review and change
              expressed choices at any time by resurfacing this panel via the
              provided link. To deny your consent to the specific processing
              activities described below, switch the toggles to off or use the
              &apos;Reject all&apos; button and confirm you want to save your choices.
            </p>
          </div>

          {/* Cookie Categories */}
          <div className="space-y-3">
            {cookieCategories.map((category) => {
              const isExpanded = expandedItems.includes(category.id);
              const isChecked = getCategoryValue(category.id);

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(category.id)}
                >
                  <div className="rounded-lg border">
                    {/* Category Header */}
                    <div className="flex items-center justify-between p-4">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                          <span className="font-medium">{category.title}</span>
                        </button>
                      </CollapsibleTrigger>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={(value) =>
                          handleCategoryChange(category.id, value)
                        }
                        disabled={category.required}
                      />
                    </div>

                    {/* Category Description */}
                    <CollapsibleContent>
                      <div className="border-t px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="flex gap-2">
            <Button
              onClick={handleAcceptAll}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Accept all
            </Button>
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="border-gray-900 text-gray-900 hover:bg-gray-100"
            >
              Reject all
            </Button>
          </div>
          <Button variant="outline" onClick={handleSavePreferences}>
            Accept current selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
