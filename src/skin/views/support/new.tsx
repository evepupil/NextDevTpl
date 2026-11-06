"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicketController } from "@/features/support/view";
import { Link } from "@/i18n/routing";

export function SupportNewView() {
  const t = useTranslations("Support");
  const { actions, model, state } = useCreateTicketController();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("pages.newTitle")}
          </h2>
          <p className="text-muted-foreground">{t("pages.newDescription")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.ticketInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={actions.onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">{t("pages.subject")}</Label>
              <Input
                id="subject"
                placeholder={t("pages.subjectPlaceholder")}
                value={model.subject}
                onChange={(event) => actions.setSubject(event.target.value)}
                required
                minLength={5}
                maxLength={200}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{t("pages.category")}</Label>
                <Select
                  value={model.category}
                  onValueChange={actions.setCategory}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("pages.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {model.categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {t(category.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">{t("pages.priority")}</Label>
                <Select
                  value={model.priority}
                  onValueChange={actions.setPriority}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder={t("pages.priorityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {model.priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {t(priority.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("pages.message")}</Label>
              <Textarea
                id="message"
                placeholder={t("pages.messagePlaceholder")}
                value={model.message}
                onChange={(event) => actions.setMessage(event.target.value)}
                required
                minLength={10}
                maxLength={5000}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {t("pages.characterCount", {
                  count: model.messageCharacterCount,
                })}
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/support">
                <Button type="button" variant="outline">
                  {t("pages.cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={state.isLoading}>
                {state.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("pages.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
