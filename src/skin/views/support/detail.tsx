"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupportDetailViewProps } from "@/features/support/view";
import { Link } from "@/i18n/routing";

import { TicketBadges } from "./components/ticket-badges";
import { TicketMessageForm } from "./components/ticket-message-form";

const CATEGORY_LABELS = {
  billing: "categories.billing",
  technical: "categories.technical",
  bug: "categories.bug",
  feature: "categories.feature",
  other: "categories.other",
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SupportDetailView({
  ticket,
  messages,
  locale,
}: SupportDetailViewProps) {
  const t = useTranslations("Support");
  const categoryLabel =
    CATEGORY_LABELS[ticket.category as keyof typeof CATEGORY_LABELS];
  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {ticket.subject}
          </h2>
          <p className="text-muted-foreground">
            {categoryLabel ? t(categoryLabel) : ticket.category} ·{" "}
            {t("pages.createdAt")}{" "}
            {new Date(ticket.createdAt).toLocaleDateString(locale)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TicketBadges priority={ticket.priority} status={ticket.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.conversation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 p-4 rounded-lg ${
                message.isAdminResponse ? "bg-primary/10" : "bg-muted/50"
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={message.user?.image || undefined}
                  alt={message.user?.name || t("pages.userFallback")}
                />
                <AvatarFallback
                  className={
                    message.isAdminResponse
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                  }
                >
                  {message.user?.name
                    ? getInitials(message.user.name)
                    : t("pages.userInitial")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {message.user?.name || t("pages.userFallback")}
                  </span>
                  {message.isAdminResponse && (
                    <Badge variant="secondary" className="text-xs">
                      {t("pages.supportStaff")}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString(locale)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isClosed ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            {t("pages.closedNotice")}
          </CardContent>
        </Card>
      ) : (
        <TicketMessageForm ticketId={ticket.id} />
      )}
    </div>
  );
}
