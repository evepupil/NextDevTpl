"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type {
  SupportDetailViewProps,
  SupportTicketDetail,
} from "@/features/support/view";
import { useSupportReplyController } from "@/features/support/view";

import { TextArea } from "../shared/fields";

function ReplyForm({ ticket }: { ticket: SupportTicketDetail }) {
  const controller = useSupportReplyController(ticket.id);
  const t = useTranslations("Support");
  return (
    <form
      className="mt-6 grid gap-3 border-t border-border pt-5"
      onSubmit={controller.actions.onSubmit}
    >
      <label className="text-sm font-semibold" htmlFor="reply-content">
        {t("addReply")}
      </label>
      <TextArea
        id="reply-content"
        onChange={(event) =>
          controller.actions.setContent(event.currentTarget.value)
        }
        placeholder={t("inputPlaceholder")}
        required
        value={controller.model.content}
      />
      <Button
        className="justify-self-start"
        disabled={controller.state.isLoading}
        type="submit"
      >
        {controller.state.isLoading ? "Sending..." : t("sendReply")}
      </Button>
    </form>
  );
}

export function SupportDetail({
  currentUserId,
  locale,
  messages,
  ticket,
}: SupportDetailViewProps) {
  const format = useFormatter();
  const t = useTranslations("Support");
  const tStatuses = useTranslations("Support.statuses");
  const tDashboard = useTranslations("Dashboard.pages");
  const tCategories = useTranslations("Support.categories");
  const tPriorities = useTranslations("Support.priorities");
  const categoryLabels: Record<string, string> = {
    billing: tCategories("billing"),
    technical: tCategories("technical"),
    bug: tCategories("bug"),
    feature: tCategories("feature"),
    other: tCategories("other"),
  };
  const priorityLabels: Record<string, string> = {
    low: tPriorities("low"),
    medium: tPriorities("medium"),
    high: tPriorities("high"),
  };
  const status =
    ticket.status === "in_progress"
      ? tStatuses("in_progress")
      : ticket.status === "resolved"
        ? tStatuses("resolved")
        : ticket.status === "closed"
          ? tStatuses("closed")
          : tStatuses("open");

  return (
    <div
      className="min-w-0"
      data-locale={locale}
      data-skin-view="support.detail"
    >
      <header className="mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs font-semibold uppercase text-primary">
          {tDashboard("ticketDetails")}
        </p>
        <h1 className="mt-2 break-words font-mono text-3xl font-semibold">
          {ticket.subject}
        </h1>
        <p className="mt-2 break-words text-sm text-muted-foreground">
          {categoryLabels[ticket.category] ?? ticket.category} ·{" "}
          {priorityLabels[ticket.priority] ?? ticket.priority} · {status}
        </p>
      </header>
      <section aria-label={t("pages.conversation")}>
        <h2 className="font-mono text-xl font-semibold">
          {t("pages.conversation")}
        </h2>
        {messages.length === 0 ? (
          <p className="mt-4 border-y border-border py-4 text-sm text-muted-foreground">
            {locale === "zh" ? "暂无消息。" : "No messages yet."}
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border border-y border-border">
            {messages.map((message) => (
              <article className="grid gap-2 py-4" key={message.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-words text-sm font-semibold">
                    {message.isAdminResponse
                      ? t("pages.supportStaff")
                      : message.user?.id === currentUserId
                        ? (message.user.name ?? t("pages.userFallback"))
                        : (message.user?.name ?? t("pages.userFallback"))}
                  </p>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={message.createdAt}
                  >
                    {format.dateTime(new Date(message.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {message.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
      {ticket.status === "closed" ? (
        <p className="mt-6 border-l-2 border-warning pl-3 text-sm">
          {t("ticketClosedNotice")}
        </p>
      ) : (
        <ReplyForm ticket={ticket} />
      )}
    </div>
  );
}
