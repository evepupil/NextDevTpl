import { Check, GitBranch, Rocket, Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

const steps = [
  {
    icon: GitBranch,
    step: "01",
    code: "git clone https://github.com/nextdevtpl/starter",
    id: "clone",
  },
  {
    icon: Settings,
    step: "02",
    code: "cp .env.example .env.local",
    id: "configure",
  },
  {
    icon: Rocket,
    step: "03",
    code: "vercel deploy --prod",
    id: "deploy",
  },
];

export async function HowItWorks() {
  const t = await getTranslations("Marketing.howItWorks");

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex gap-6 md:gap-10">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 h-[calc(100%-2rem)] w-px bg-border md:left-10" />
                )}

                {/* Icon */}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm md:h-20 md:w-20">
                  <Icon className="h-5 w-5 text-violet-600 md:h-8 md:w-8" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-medium text-violet-600">
                      {t("stepLabel", { step: step.step })}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {t(`steps.${step.id}.title`)}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {t(`steps.${step.id}.description`)}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 font-mono text-sm">
                    <code>{step.code}</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border bg-muted/50 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
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
