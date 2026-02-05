"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketCategories, ticketPriorities } from "@/features/support/schemas";
import { createTicketAction } from "@/features/support/actions";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";

/**
 * 新建工单页面
 *
 * 用户填写表单创建新的支持工单
 */
export default function NewTicketPage() {
  const router = useRouter();
  const t = useTranslations("Support.new");
  const tCategories = useTranslations("Support.categories");
  const tPriorities = useTranslations("Support.priorities");
  const [isLoading, setIsLoading] = useState(false);

  // 表单状态
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [priority, setPriority] = useState<string>("medium");
  const [message, setMessage] = useState("");

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createTicketAction({
        subject,
        category: category as "billing" | "technical" | "bug" | "feature" | "other",
        priority: priority as "low" | "medium" | "high",
        message,
      });

      if (result?.data) {
        toast.success(t("toast.success"));
        router.push(`/dashboard/support/${result.data.ticketId}`);
      } else if (result?.serverError) {
        toast.error(t("toast.error"));
        console.error(result.serverError);
      }
    } catch (error) {
      toast.error(t("toast.error"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* 工单表单 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 主题 */}
            <div className="space-y-2">
              <Label htmlFor="subject">{t("fields.subject.label")}</Label>
              <Input
                id="subject"
                placeholder={t("fields.subject.placeholder")}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                minLength={5}
                maxLength={200}
              />
            </div>

            {/* 类别和优先级 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{t("fields.category.label")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("fields.category.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {tCategories(cat.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">{t("fields.priority.label")}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder={t("fields.priority.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketPriorities.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        {tPriorities(pri.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 详细描述 */}
            <div className="space-y-2">
              <Label htmlFor="message">{t("fields.message.label")}</Label>
              <Textarea
                id="message"
                placeholder={t("fields.message.placeholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={10}
                maxLength={5000}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {t("fields.message.count", { count: message.length })}
              </p>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-4">
              <Link href="/dashboard/support">
                <Button type="button" variant="outline">
                  {t("actions.cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("actions.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
