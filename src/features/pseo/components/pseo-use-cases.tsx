import { Card, CardContent } from "@/components/ui/card";

import type { PseoPage } from "../lib/pseo-data";

export function PseoUseCases({ page }: { page: PseoPage }) {
  const { sections, useCases } = page.data;

  return (
    <section className="container py-24" id="use-cases">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {sections.useCases.title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {sections.useCases.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <Card
              key={useCase.title}
              className="rounded-2xl border-0 bg-muted/50 transition-colors hover:bg-muted"
            >
              <CardContent className="flex h-full flex-col p-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {useCase.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {useCase.description}
                </p>
                <div className="mt-auto pt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-primary">
                      {useCase.metric}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {useCase.metricLabel}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
