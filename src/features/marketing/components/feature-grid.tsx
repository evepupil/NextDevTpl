import {
  Cloud,
  Code2,
  Layers,
  Lock,
  Palette,
  Rocket,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { id: "themes", icon: Palette },
  { id: "auth", icon: Lock },
  { id: "fast", icon: Zap },
  { id: "typeSafe", icon: Code2 },
  { id: "deploy", icon: Cloud },
  { id: "database", icon: Layers },
  { id: "dx", icon: Settings },
  { id: "ai", icon: Sparkles },
  { id: "production", icon: Rocket },
];

export async function FeatureGrid() {
  const t = await getTranslations("Marketing.featureGrid");

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.id}
                className="group rounded-xl border-0 bg-muted/50 transition-colors hover:bg-muted"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-900/50">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">
                    {t(`items.${feature.id}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`items.${feature.id}.description`)}
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
