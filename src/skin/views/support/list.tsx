"use client";

import { Plus, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupportListViewProps } from "@/features/support/view";
import { Link } from "@/i18n/routing";

import { TicketBadges } from "./components/ticket-badges";

const CATEGORY_LABELS = {
  billing: "categories.billing",
  technical: "categories.technical",
  bug: "categories.bug",
  feature: "categories.feature",
  other: "categories.other",
} as const;

export function SupportListView({ locale, tickets }: SupportListViewProps) {
  const t = useTranslations("Support");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("pages.title")}
          </h2>
          <p className="text-muted-foreground">{t("pages.description")}</p>
        </div>
        <Link href="/dashboard/support/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("pages.newTicket")}
          </Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("pages.emptyTitle")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("pages.emptyDescription")}
            </p>
            <Link href="/dashboard/support/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("pages.createFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const categoryLabel =
              CATEGORY_LABELS[ticket.category as keyof typeof CATEGORY_LABELS];

            return (
              <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {ticket.subject}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {categoryLabel ? t(categoryLabel) : ticket.category} ·{" "}
                          {new Date(ticket.createdAt).toLocaleDateString(
                            locale
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TicketBadges
                          priority={ticket.priority}
                          status={ticket.status}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
