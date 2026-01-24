"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SendIcon, Loader2Icon, BotIcon, UserIcon } from "lucide-react";
import { useRef, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * AI 聊天界面组件
 *
 * 提供类似 ChatGPT 的聊天体验
 * 支持流式响应和消息历史
 */
export function ChatInterface() {
  // 输入框状态
  const [input, setInput] = useState("");

  // 使用 Vercel AI SDK v6 的 useChat hook
  const { messages, sendMessage, status } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/ai/chat",
      }),
    });

  // 判断是否正在加载
  const isLoading = status === "submitted" || status === "streaming";

  // 消息列表容器引用，用于自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * 处理表单提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 发送消息
    sendMessage({ text: input });
    setInput("");
  };

  /**
   * 获取消息文本内容
   */
  const getMessageContent = (message: typeof messages[number]) => {
    // AI SDK v6 使用 parts 数组存储消息内容
    if (message.parts) {
      return message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("");
    }
    return "";
  };

  return (
    <div className="flex h-full flex-col">
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 空状态提示 */}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BotIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">开始对话</p>
              <p className="text-sm">输入消息与 AI 助手交流</p>
            </div>
          </div>
        )}

        {/* 消息气泡列表 */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* 头像 */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? (
                <UserIcon className="h-4 w-4" />
              ) : (
                <BotIcon className="h-4 w-4" />
              )}
            </div>

            {/* 消息内容 */}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="whitespace-pre-wrap text-sm">{getMessageContent(message)}</p>
            </div>
          </div>
        ))}

        {/* 加载指示器 */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <BotIcon className="h-4 w-4" />
            </div>
            <div className="rounded-lg bg-muted px-4 py-2">
              <Loader2Icon className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input}>
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
