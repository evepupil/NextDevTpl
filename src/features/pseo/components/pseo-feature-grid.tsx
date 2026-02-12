import {
  Layers,
  LineChart,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { PseoPage } from "../lib/pseo-data";

const iconMap = {
  sparkles: Sparkles,
  target: Target,
  lineChart: LineChart,
  share: Share2,
  layers: Layers,
  shield: ShieldCheck,
  zap: Zap,
  users: Users,
};

type IconKey = keyof typeof iconMap;

export function PseoFeatureGrid({ page }: { page: PseoPage }) {
  const { sections, features } = page.data;

  return (
    <section className="container py-24" id="features">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            {page.category}
          </Badge>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {sections.features.title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {sections.features.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = iconMap[feature.icon as IconKey] ?? Sparkles;
            return (
              <Card
                key={feature.title}
                className="group rounded-2xl border-0 bg-muted/50 transition-colors hover:bg-muted"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
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
