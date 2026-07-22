"use client";

/**
 * 订阅等级徽章组件
 *
 * 全部走设计系统 token，靠「中性 → 主色浅 → 金 → 主色实」的层次区分
 * 四档计划，不再用紫粉/琥珀彩虹渐变 + 光晕（旧版那套是 AI 廉价感来源）。
 * - free:   muted（中性，最低存在感）
 * - starter: primary 浅底（品牌色淡）
 * - pro:    warning 浅底（金色 = 高级感）
 * - ultra:  primary 实底（最突出）
 */

import { Crown, Gem, Sparkles, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type PlanType = "free" | "starter" | "pro" | "ultra";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

interface PlanBadgeProps {
  plan: PlanType;
  size?: BadgeSize;
  showLabel?: boolean;
  className?: string;
}

const sizeConfig: Record<
  BadgeSize,
  { badge: string; icon: string; text: string }
> = {
  xs: { badge: "h-5 px-1.5 gap-0.5", icon: "h-3 w-3", text: "text-[10px]" },
  sm: { badge: "h-6 px-2 gap-1", icon: "h-3.5 w-3.5", text: "text-xs" },
  md: { badge: "h-7 px-2.5 gap-1.5", icon: "h-4 w-4", text: "text-sm" },
  lg: { badge: "h-8 px-3 gap-2", icon: "h-5 w-5", text: "text-base" },
};

const planConfig: Record<
  PlanType,
  { icon: typeof User; labelKey: string; baseStyles: string }
> = {
  free: {
    icon: User,
    labelKey: "free",
    baseStyles: "bg-muted text-muted-foreground",
  },
  starter: {
    icon: Sparkles,
    labelKey: "starter",
    baseStyles: "bg-primary/15 text-primary",
  },
  pro: {
    icon: Crown,
    labelKey: "pro",
    baseStyles: "bg-warning/15 text-warning",
  },
  ultra: {
    icon: Gem,
    labelKey: "ultra",
    baseStyles: "bg-primary text-primary-foreground",
  },
};

export function PlanBadge({
  plan,
  size = "sm",
  showLabel = true,
  className,
}: PlanBadgeProps) {
  const t = useTranslations("Subscription");
  const config = planConfig[plan];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        sizeStyles.badge,
        config.baseStyles,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      {showLabel && (
        <span
          className={cn(
            "font-semibold tracking-wide uppercase",
            sizeStyles.text
          )}
        >
          {t(`plans.${config.labelKey}`)}
        </span>
      )}
    </div>
  );
}
