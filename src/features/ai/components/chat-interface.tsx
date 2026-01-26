"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Loader2Icon,
  BotIcon,
  UserIcon,
  ChevronDown,
  ArrowUp,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * 示例问题列表
 */
const exampleQuestions = [
  "What are the advantages of using Next.js?",
  "Help me write an essay about Silicon Valley",
  "What is the weather in San Francisco with 37.7749° N, 122.4194° W?",
];

/**
 * AI 模型类型定义
 */
interface ChatModel {
  id: string;
  name: string;
}

/**
 * 可选的 AI 模型
 */
const chatModels: ChatModel[] = [
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-3", name: "Claude 3" },
];

/**
 * AI 聊天界面组件
 *
 * 提供类似 ChatGPT 的聊天体验
 * 支持流式响应和消息历史
 */
export function ChatInterface() {
  // 输入框状态
  const [input, setInput] = useState("");
  // 选中的模型
  const [selectedModel, setSelectedModel] = useState<ChatModel>(chatModels[0]!);

  // 使用 Vercel AI SDK v6 的 useChat hook
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
    }),
  });

  // 判断是否正在加载
  const isLoading = status === "submitted" || status === "streaming";

  // 消息列表容器引用，用于自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 输入框引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * 处理表单提交
   */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // 发送消息
    sendMessage({ text: input });
    setInput("");
  };

  /**
   * 处理示例问题点击
   */
  const handleExampleClick = (question: string) => {
    sendMessage({ text: question });
  };

  /**
   * 处理键盘事件 (Enter 发送, Shift+Enter 换行)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * 获取消息文本内容
   */
  const getMessageContent = (message: (typeof messages)[number]) => {
    // AI SDK v6 使用 parts 数组存储消息内容
    if (message.parts) {
      return message.parts
        .filter(
          (part): part is { type: "text"; text: string } => part.type === "text"
        )
        .map((part) => part.text)
        .join("");
    }
    return "";
  };

  // 是否显示欢迎界面（无消息时）
  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto">
        {showWelcome ? (
          // 欢迎界面
          <div className="flex h-full flex-col">
            {/* 顶部欢迎语 */}
            <div className="px-4 pt-8 md:px-8">
              <h1 className="text-2xl font-bold">Hello there!</h1>
              <p className="text-muted-foreground">
                How can I help you today?
              </p>
            </div>

            {/* 占位空间 */}
            <div className="flex-1" />

            {/* 示例问题 */}
            <div className="px-4 pb-4 md:px-8">
              <div className="mx-auto max-w-2xl space-y-2">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleExampleClick(question)}
                    className="w-full rounded-lg border bg-background px-4 py-3 text-center text-sm transition-colors hover:bg-muted"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 消息列表
          <div className="space-y-4 p-4 md:p-8">
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
                  <p className="whitespace-pre-wrap text-sm">
                    {getMessageContent(message)}
                  </p>
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
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t bg-background p-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit}>
            <div className="rounded-lg border bg-background">
              {/* 文本输入框 */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                className="min-h-[60px] resize-none border-0 bg-transparent px-4 py-3 text-sm focus-visible:ring-0"
                disabled={isLoading}
                rows={2}
              />

              {/* 底部工具栏 */}
              <div className="flex items-center justify-between border-t px-3 py-2">
                {/* 模型选择器 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-muted-foreground"
                    >
                      {selectedModel.name}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {chatModels.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                      >
                        {model.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 发送按钮 */}
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
