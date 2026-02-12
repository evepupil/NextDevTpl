import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

import type { PseoPage } from "../lib/pseo-data";

export function PseoCta({ page }: { page: PseoPage }) {
  const { cta } = page.data;

  return (
    <section className="container py-24" id="cta">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground md:px-16 md:py-16">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {cta.title}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
              {cta.description}
            </p>

            <div className="mb-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 bg-white text-primary" asChild>
                <Link href={cta.primaryCta.href}>
                  <MessageCircle className="h-4 w-4" />
                  {cta.primaryCta.label}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
                asChild
              >
                <Link href={cta.secondaryCta.href}>{cta.secondaryCta.label}</Link>
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/70">{cta.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
