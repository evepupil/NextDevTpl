"use client";

import { useTranslations } from "next-intl";
import { Check, FileUp, Sparkles, Download } from "lucide-react";

const stepConfig = [
  { key: "upload" as const, icon: FileUp, step: "01" },
  { key: "generate" as const, icon: Sparkles, step: "02" },
  { key: "export" as const, icon: Download, step: "03" },
];

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section id="how-it-works" className="container py-24 bg-muted/30">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
            {t("label")}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {stepConfig.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex gap-6 md:gap-10">
                {/* Connector Line */}
                {index < stepConfig.length - 1 && (
                  <div className="absolute left-6 top-16 h-[calc(100%-2rem)] w-px bg-border md:left-10" />
                )}

                {/* Icon */}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm md:h-20 md:w-20">
                  <Icon className="h-5 w-5 text-primary md:h-8 md:w-8" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-medium text-primary">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{t("completion.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("completion.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
