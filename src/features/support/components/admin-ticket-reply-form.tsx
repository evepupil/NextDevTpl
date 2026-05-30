"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { adminReplyTicketAction } from "@/features/support/actions";

interface AdminTicketReplyFormProps {
  /** 工单 ID */
  ticketId: string;
  /** 工单是否已关闭 */
  isClosed: boolean;
}

/**
 * 管理员工单回复表单组件
 *
 * 管理员在工单中添加回复
 */
export function AdminTicketReplyForm({
  ticketId,
  isClosed,
}: AdminTicketReplyFormProps) {
  const router = useRouter();
  const t = useTranslations("Support");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 处理消息提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error(t("enterReplyContent"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await adminReplyTicketAction({
        ticketId,
        content: content.trim(),
      });

      if (result?.data) {
        toast.success(t("replySuccess"));
        setContent("");
        router.refresh();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error(t("replyFailed"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isClosed) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          {t("ticketClosedNotice")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("replyUser")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={t("inputReplyPlaceholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {content.length}/5000 {t("characters")}
            </p>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("sendReply")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
