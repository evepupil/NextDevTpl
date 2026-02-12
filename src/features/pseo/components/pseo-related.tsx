import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

import type { PseoPage } from "../lib/pseo-data";

interface PseoRelatedProps {
  pages: PseoPage[];
  title: string;
  subtitle: string;
}

export function PseoRelated({ pages, title, subtitle }: PseoRelatedProps) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <section className="container py-24" id="related">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pages.map((page) => (
            <Card
              key={page.slug}
              className="group rounded-2xl border-0 bg-muted/50 transition-colors hover:bg-muted"
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Badge variant="secondary">{page.category}</Badge>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {page.data.hero.title} {page.data.hero.highlight}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {page.data.seo.description}
                </p>
                <div className="mt-auto">
                  <Link
                    href={`/pseo/${page.slug}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    View template
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
