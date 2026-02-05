"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addTicketMessageAction } from "@/features/support/actions";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";

interface TicketMessageFormProps {
  /** 工单 ID */
  ticketId: string;
  /** 是否为管理员模式 */
  isAdmin?: boolean;
}

/**
 * 工单消息回复表单组件
 *
 * 用于用户或管理员在工单中添加新消息
 */
export function TicketMessageForm({
  ticketId,
  isAdmin = false,
}: TicketMessageFormProps) {
  const router = useRouter();
  const t = useTranslations("Support.messageForm");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 处理消息提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error(t("errors.empty"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await addTicketMessageAction({
        ticketId,
        content: content.trim(),
      });

      if (result?.data) {
        toast.success(t("success"));
        setContent("");
        router.refresh();
      } else if (result?.serverError) {
        toast.error(t("errors.sendFailed"));
        console.error(result.serverError);
      }
    } catch (error) {
      toast.error(t("errors.sendFailed"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAdmin ? t("titleAdmin") : t("titleUser")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={isAdmin ? t("placeholderAdmin") : t("placeholderUser")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("count", { count: content.length })}
            </p>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? (
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
