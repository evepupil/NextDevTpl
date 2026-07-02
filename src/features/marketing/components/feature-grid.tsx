"use client";

import {
  Coins,
  CreditCard,
  Languages,
  LayoutGrid,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * 功能模块配置
 * - icon 与卡片内容匹配（认证/支付/积分/异步/国际化/管理后台）
 * - path 是展示用的"工程化"代码路径标签，不需要翻译
 */
const featureConfig = [
  { key: "ai" as const, icon: ShieldCheck, path: "/auth" },
  { key: "multiSource" as const, icon: CreditCard, path: "/payment" },
  { key: "outline" as const, icon: Coins, path: "/credits" },
  { key: "export" as const, icon: Zap, path: "/jobs" },
  { key: "batch" as const, icon: Languages, path: "/i18n" },
  { key: "multilingual" as const, icon: LayoutGrid, path: "/admin" },
];

export function FeatureGrid() {
  const t = useTranslations("Features");

  return (
    <section id="features" className="border-t py-24">
      <div className="container">
        {/* 头部：左标题 + 右说明，编辑式非居中布局 */}
        <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">{t("label")}</span>
            <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {t("title")}
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* 卡片网格：用 1px gap + 边框色底做出"发丝分割"的连体网格 */}
        <div className="grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-2 lg:grid-cols-3">
          {featureConfig.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group relative bg-card p-7 transition-colors hover:bg-muted/40"
              >
                {/* 右上角代码路径索引 */}
                <span className="absolute top-6 right-6 font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/60 uppercase">
                  {feature.path}
                </span>

                {/* 图标：hover 时反色填充 */}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mb-2 font-semibold tracking-tight">
                  {t(`items.${feature.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
