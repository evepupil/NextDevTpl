"use client";

/**
 * 订阅等级徽章组件
 *
 * 根据用户订阅等级显示不同样式的徽章：
 * - Free: 灰色静态
 * - Starter: 蓝色微光
 * - Pro: 金色流光动画
 * - Ultra: 紫色极光 + 脉冲光晕
 */

import "./plan-badge.css";

import { Crown, Gem, Sparkles, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * 订阅计划类型
 */
export type PlanType = "free" | "starter" | "pro" | "ultra";

/**
 * 徽章尺寸
 */
export type BadgeSize = "xs" | "sm" | "md" | "lg";

/**
 * PlanBadge 组件属性
 */
interface PlanBadgeProps {
  /** 订阅计划类型 */
  plan: PlanType;
  /** 徽章尺寸 */
  size?: BadgeSize;
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 尺寸配置
 */
const sizeConfig: Record<BadgeSize, { badge: string; icon: string; text: string }> = {
  xs: { badge: "h-5 px-1.5 gap-0.5", icon: "h-3 w-3", text: "text-[10px]" },
  sm: { badge: "h-6 px-2 gap-1", icon: "h-3.5 w-3.5", text: "text-xs" },
  md: { badge: "h-7 px-2.5 gap-1.5", icon: "h-4 w-4", text: "text-sm" },
  lg: { badge: "h-8 px-3 gap-2", icon: "h-5 w-5", text: "text-base" },
};

/**
 * 计划配置
 */
const planConfig: Record<PlanType, {
  icon: typeof User;
  labelKey: string;
  baseStyles: string;
  glowStyles: string;
  animationClass: string;
}> = {
  free: {
    icon: User,
    labelKey: "free",
    baseStyles: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    glowStyles: "",
    animationClass: "",
  },
  starter: {
    icon: Sparkles,
    labelKey: "starter",
    baseStyles: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    glowStyles: "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    animationClass: "plan-badge-shimmer",
  },
  pro: {
    icon: Crown,
    labelKey: "pro",
    baseStyles: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 dark:from-amber-900/50 dark:to-yellow-900/50 dark:text-amber-300",
    glowStyles: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    animationClass: "plan-badge-shine",
  },
  ultra: {
    icon: Gem,
    labelKey: "ultra",
    baseStyles: "bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 text-purple-700 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-purple-900/50 dark:text-purple-300",
    glowStyles: "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    animationClass: "plan-badge-aurora",
  },
};

/**
 * 订阅等级徽章组件
 */
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
        "relative inline-flex items-center justify-center rounded-full font-medium overflow-hidden",
        sizeStyles.badge,
        config.baseStyles,
        config.glowStyles,
        config.animationClass,
        className
      )}
    >
      {/* 动画背景层 */}
      {plan !== "free" && (
        <div
          className={cn(
            "absolute inset-0 opacity-0",
            plan === "starter" && "plan-badge-shimmer-bg",
            plan === "pro" && "plan-badge-shine-bg",
            plan === "ultra" && "plan-badge-aurora-bg"
          )}
        />
      )}

      {/* 内容层 */}
      <Icon className={cn("relative z-10", sizeStyles.icon)} />
      {showLabel && (
        <span className={cn("relative z-10 font-semibold uppercase tracking-wide", sizeStyles.text)}>
          {t(`plans.${config.labelKey}`)}
        </span>
      )}
    </div>
  );
}
