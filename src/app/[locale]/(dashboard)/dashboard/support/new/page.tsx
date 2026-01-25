"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

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

/**
 * 新建工单页面
 *
 * 用户填写表单创建新的支持工单
 */
export default function NewTicketPage() {
  const router = useRouter();
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
        toast.success("工单创建成功");
        router.push(`/dashboard/support/${result.data.ticketId}`);
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error("创建工单失败，请重试");
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
          <h2 className="text-2xl font-bold tracking-tight">新建工单</h2>
          <p className="text-muted-foreground">
            描述您遇到的问题，我们会尽快回复
          </p>
        </div>
      </div>

      {/* 工单表单 */}
      <Card>
        <CardHeader>
          <CardTitle>工单信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 主题 */}
            <div className="space-y-2">
              <Label htmlFor="subject">主题 *</Label>
              <Input
                id="subject"
                placeholder="简要描述您的问题"
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
                <Label htmlFor="category">类别</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketPriorities.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        {pri.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 详细描述 */}
            <div className="space-y-2">
              <Label htmlFor="message">详细描述 *</Label>
              <Textarea
                id="message"
                placeholder="请详细描述您遇到的问题，包括：&#10;- 问题发生的时间&#10;- 具体的错误信息&#10;- 您已尝试的解决方法"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={10}
                maxLength={5000}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/5000 字符
              </p>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-4">
              <Link href="/dashboard/support">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交工单
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
