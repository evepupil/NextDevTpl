"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS = {
  open: "statuses.open",
  in_progress: "statuses.in_progress",
  resolved: "statuses.resolved",
  closed: "statuses.closed",
} as const;

const PRIORITY_LABELS = {
  low: "priorities.low",
  medium: "priorities.medium",
  high: "priorities.high",
} as const;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-primary/15 text-primary",
  in_progress: "bg-warning/15 text-warning",
  resolved: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

interface TicketBadgesProps {
  priority: string;
  status: string;
}

export function TicketBadges({ priority, status }: TicketBadgesProps) {
  const t = useTranslations("Support");
  const statusLabel = STATUS_LABELS[status as keyof typeof STATUS_LABELS];
  const priorityLabel =
    PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS];

  return (
    <>
      <Badge
        className={PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}
        variant="secondary"
      >
        {priorityLabel ? t(priorityLabel) : priority}
      </Badge>
      <Badge
        className={STATUS_COLORS[status] || STATUS_COLORS.closed}
        variant="secondary"
      >
        {statusLabel ? t(statusLabel) : status}
      </Badge>
    </>
  );
}
