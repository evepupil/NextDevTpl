import { ChatInterface } from "@/components/ai-elements";

/**
 * AI 聊天页面
 *
 * Dashboard 中的 AI 助手聊天界面
 */
export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* 页面标题 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI 助手</h1>
        <p className="text-muted-foreground">与 AI 助手进行对话</p>
      </div>

      {/* 聊天界面 */}
      <div className="flex-1 rounded-lg border bg-card">
        <ChatInterface />
      </div>
    </div>
  );
}
