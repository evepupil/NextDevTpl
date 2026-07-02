"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * HowItWorks —— 三步流程
 *
 * 用编号 01/02/03 是因为内容本身就是有序流程（克隆 → 配置 → 上线），
 * 编码承载信息，所以保留；非装饰性编号。
 */
const steps: {
  key: "upload" | "generate" | "export";
  n: string;
  code: ReactNode;
}[] = [
  {
    key: "upload",
    n: "01",
    code: (
      <code className="block">
        <span className="text-muted-foreground/60">$</span> git clone
        nextdev-tpl{"\n"}
        <span className="text-muted-foreground/60">$</span> pnpm install
      </code>
    ),
  },
  {
    key: "generate",
    n: "02",
    code: (
      <code className="block">
        <span className="text-muted-foreground/60">.env</span>
        {"\n"}DATABASE_URL=
        <span className="text-muted-foreground">postgres://…</span>
        {"\n"}BETTER_AUTH_SECRET=
        <span className="text-muted-foreground">…</span>
        {"\n"}AI_PROVIDER=<span className="text-primary">"openai"</span>
      </code>
    ),
  },
  {
    key: "export",
    n: "03",
    code: (
      <code className="block">
        <span className="text-muted-foreground/60">$</span> pnpm build{" "}
        <span className="text-muted-foreground/60">&amp;&amp;</span> deploy
        {"\n"}
        <span className="text-muted-foreground/60">→</span> live in ~6 min
      </code>
    ),
  },
];

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section id="how-it-works" className="border-t bg-muted/30 py-24">
      <div className="container">
        {/* 头部 */}
        <div className="mb-14 max-w-2xl">
          <span className="eyebrow">{t("label")}</span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* 三步流程 */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                {t(`steps.${s.key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`steps.${s.key}.description`)}
              </p>
              <pre className="mt-5 overflow-x-auto rounded-lg border bg-card p-4 font-mono text-xs leading-relaxed text-foreground">
                {s.code}
              </pre>
            </div>
          ))}
        </div>

        {/* 完成提示条 */}
        <div className="mt-10 flex items-center gap-4 rounded-xl border bg-card p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{t("completion.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("completion.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
