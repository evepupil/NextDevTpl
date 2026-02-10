"use client";

import {
  BookOpen,
  BrainCircuit,
  Download,
  FileInput,
  Languages,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

const featureConfig = [
  { key: "ai" as const, icon: BrainCircuit },
  { key: "multiSource" as const, icon: FileInput },
  { key: "outline" as const, icon: BookOpen },
  { key: "export" as const, icon: Download },
  { key: "batch" as const, icon: Zap },
  { key: "multilingual" as const, icon: Languages },
];

export function FeatureGrid() {
  const t = useTranslations("Features");
  return (
    <section id="features" className="container py-24">
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

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureConfig.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.key}
                className="group border-border shadow-none transition-colors hover:bg-accent/50"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">
                    {t(`items.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`items.${feature.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
