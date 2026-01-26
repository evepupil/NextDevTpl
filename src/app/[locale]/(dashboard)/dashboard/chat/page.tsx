import { ChatInterface } from "@/features/ai/components";

/**
 * AI 聊天页面
 *
 * Dashboard 中的 AI 助手聊天界面
 */
export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface />
    </div>
  );
}
