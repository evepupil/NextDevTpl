import { ChatInterface } from "@/features/ai/components";

/**
 * AI 聊天页面
 *
 * Dashboard 中的 AI 助手聊天界面
 * 高度计算: 100vh - 外边距(20px) - header(56px) - 内边距(48px) = 100vh - 7.75rem
 */
export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-7.75rem)]">
      <ChatInterface />
    </div>
  );
}
