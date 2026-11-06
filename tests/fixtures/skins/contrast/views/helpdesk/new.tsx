"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { SupportNewViewProps } from "@/features/support/view";
import { useCreateTicketController } from "@/features/support/view";
import { Link } from "@/i18n/routing";

import { FormField, SelectInput, TextArea, TextInput } from "../shared/fields";

export function NewSupportTicket(_props: SupportNewViewProps) {
  const locale = useLocale();
  const controller = useCreateTicketController();
  const t = useTranslations("Support");
  const categoryLabels: Record<string, string> = {
    billing: t("categories.billing"),
    technical: t("categories.technical"),
    bug: t("categories.bug"),
    feature: t("categories.feature"),
    other: t("categories.other"),
  };
  const priorityLabels: Record<string, string> = {
    low: t("priorities.low"),
    medium: t("priorities.medium"),
    high: t("priorities.high"),
  };

  return (
    <section className="mx-auto w-full max-w-3xl" data-skin-view="support.new">
      <header className="mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs font-semibold uppercase text-primary">
          {locale === "zh" ? "NextDevTpl / 支持" : "NextDevTpl / Support"}
        </p>
        <h1 className="mt-2 break-words font-mono text-3xl font-semibold">
          {t("pages.newTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pages.newDescription")}
        </p>
      </header>
      <form className="grid gap-5" onSubmit={controller.actions.onSubmit}>
        <FormField id="ticket-subject" label={t("pages.subject")}>
          <TextInput
            id="ticket-subject"
            maxLength={200}
            onChange={(event) =>
              controller.actions.setSubject(event.currentTarget.value)
            }
            placeholder={t("pages.subjectPlaceholder")}
            required
            value={controller.model.subject}
          />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="ticket-category" label={t("pages.category")}>
            <SelectInput
              id="ticket-category"
              onChange={(event) =>
                controller.actions.setCategory(event.currentTarget.value)
              }
              value={controller.model.category}
            >
              {controller.model.categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {categoryLabels[option.value] ?? option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField id="ticket-priority" label={t("pages.priority")}>
            <SelectInput
              id="ticket-priority"
              onChange={(event) =>
                controller.actions.setPriority(event.currentTarget.value)
              }
              value={controller.model.priority}
            >
              {controller.model.priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {priorityLabels[option.value] ?? option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <FormField id="ticket-message" label={t("pages.message")}>
          <TextArea
            id="ticket-message"
            maxLength={5000}
            onChange={(event) =>
              controller.actions.setMessage(event.currentTarget.value)
            }
            placeholder={t("pages.messagePlaceholder")}
            required
            value={controller.model.message}
          />
          <span className="text-right text-xs text-muted-foreground">
            {t("pages.characterCount", {
              count: controller.model.messageCharacterCount,
            })}
          </span>
        </FormField>
        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button disabled={controller.state.isLoading} type="submit">
            {controller.state.isLoading ? "Sending..." : t("pages.submit")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/support">{t("pages.cancel")}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
