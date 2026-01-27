import { streamText } from "ai";

import { gpt4oMini } from "@/features/ai";

/**
 * AI 聊天 API 路由
 *
 * 处理聊天消息并返回流式响应
 * 使用 Node.js 运行时以便后续与数据库集成
 */
export async function POST(req: Request) {
  // 从请求体中提取消息
  const { messages } = await req.json();

  // 使用 GPT-4o-mini 模型进行流式文本生成
  const result = streamText({
    model: gpt4oMini,
    messages,
    system: `你是一个友好、专业的 AI 助手。你可以帮助用户解答问题、提供建议和进行对话。
请用简洁、清晰的语言回答问题。如果用户使用中文提问，请用中文回答；如果用户使用英文提问，请用英文回答。`,
  });

  // 返回流式响应 (AI SDK v6 使用 toUIMessageStreamResponse)
  return result.toUIMessageStreamResponse();
}
