import { createOpenAI } from "@ai-sdk/openai";

/**
 * OpenAI Provider 配置
 *
 * 使用环境变量中的 API Key 初始化 OpenAI 客户端
 * 注意：OPENAI_API_KEY 环境变量必须在 .env.local 中配置
 */
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

/**
 * GPT-4o 模型实例
 *
 * 用于聊天对话和文本生成
 */
export const gpt4o = openai("gpt-4o");

/**
 * GPT-4o-mini 模型实例
 *
 * 更快速、更经济的模型选项
 */
export const gpt4oMini = openai("gpt-4o-mini");
