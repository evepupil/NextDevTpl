"use client";

import { BookOpen, Briefcase, GraduationCap, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

const useCaseConfig = [
  { key: "students" as const, icon: GraduationCap },
  { key: "professionals" as const, icon: Briefcase },
  { key: "language" as const, icon: Languages },
  { key: "knowledge" as const, icon: BookOpen },
];

export function UseCasesSection() {
  const t = useTranslations("UseCases");

  return (
    <section id="use-cases" className="container py-24">
      <div className="mx-auto max-w-6xl">
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

        {/* Use Cases Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {useCaseConfig.map((uc) => {
            const Icon = uc.icon;
            const examples = t.raw(`items.${uc.key}.examples`) as string[];
            return (
              <Card
                key={uc.key}
                className="group border-border shadow-none transition-colors hover:border-primary/20"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {t(`items.${uc.key}.title`)}
                      </h3>
                      <p className="text-sm text-primary">
                        {t(`items.${uc.key}.subtitle`)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t(`items.${uc.key}.description`)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {examples.map((example) => (
                      <span
                        key={example}
                        className="inline-flex rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
