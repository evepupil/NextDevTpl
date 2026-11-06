"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSupportReplyController } from "@/features/support/view";

interface TicketMessageFormProps {
  ticketId: string;
}

export function TicketMessageForm({ ticketId }: TicketMessageFormProps) {
  const t = useTranslations("Support");
  const { actions, model, state } = useSupportReplyController(ticketId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("addReply")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={actions.onSubmit} className="space-y-4">
          <Textarea
            placeholder={t("inputPlaceholder")}
            value={model.content}
            onChange={(event) => actions.setContent(event.target.value)}
            rows={4}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {model.content.length}/5000 {t("characters")}
            </p>
            <Button
              type="submit"
              disabled={state.isLoading || !model.content.trim()}
            >
              {state.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("send")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
