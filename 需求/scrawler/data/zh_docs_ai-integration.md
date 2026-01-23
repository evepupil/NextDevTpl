# 来源: https://nextdevkit.com/zh/docs/ai-integration

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
AI 集成🚀 快速开始
# AI 集成
学习如何在 NEXTDEVKIT 中集成和使用 Vercel AI SDK，构建强大的 AI 功能
NEXTDEVKIT 集成了 **Vercel AI SDK** 和 **Google Generative AI** ，为您的应用程序提供强大的 AI 功能支持。通过简单的配置，您可以快速启用聊天机器人、图像生成等 AI 功能。
## [🚀 快速开始](https://nextdevkit.com/zh/docs/ai-integration#-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
NEXTDEVKIT 默认配置了 Google Gemini AI 模型，只需配置一个环境变量即可启用所有 AI 功能。
### [1. **配置 Google Gemini API**](https://nextdevkit.com/zh/docs/ai-integration#1-%E9%85%8D%E7%BD%AE-google-gemini-api)
获取 Google Generative AI API 密钥：
  1. 访问 
  2. 创建新项目或选择现有项目
  3. 生成 API 密钥


将 API 密钥添加到您的 `.env` 文件：
```
# ---------GenAI----------
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

### [2. **启动应用**](https://nextdevkit.com/zh/docs/ai-integration#2-%E5%90%AF%E5%8A%A8%E5%BA%94%E7%94%A8)
配置完成后，重启开发服务器：
```
pnpm dev
```

现在您可以访问 `/app/ai` 路径体验以下 AI 功能：
  * **聊天机器人** - `/app/ai/chat`
  * **图像生成** - `/app/ai/image`


## [🏗️ AI 功能架构](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-ai-%E5%8A%9F%E8%83%BD%E6%9E%B6%E6%9E%84)
NEXTDEVKIT 的 AI 集成采用模块化设计：
```
src/
├── ai/                         # AI 核心配置
│   ├── index.ts               # 模型注册和配置
│   ├── types.ts               # AI 类型定义
│   ├── errors.ts              # AI 错误处理
│   ├── prompts.ts             # 系统提示词
│   ├── agents/                # AI 智能体
│   │   └── get-weather.ts     # 天气查询工具
│   ├── image/                 # 图像生成相关
│   │   ├── suggestions.ts     # 图像生成建议
│   │   └── use-image-generation.ts # 图像生成 Hook
│   └── models/                # 模型配置
├── app/(app)/app/ai/          # AI 功能页面
│   ├── chat/                  # 聊天机器人页面
│   │   └── page.tsx
│   ├── image/                 # 图像生成页面  
│   │   └── page.tsx
│   └── layout.tsx
├── app/api/ai/demo/           # AI API 路由
│   ├── chat/                  # 聊天 API
│   │   └── route.ts
│   └── image/                 # 图像生成 API
│       └── route.ts
└── components/examples/ai/     # AI 组件库
    ├── chat/                  # 聊天组件
    │   ├── index.tsx          # 主聊天组件
    │   ├── messages.tsx       # 消息展示
    │   ├── multimodal-input.tsx # 多模态输入
    │   └── suggested-actions.tsx # 建议操作
    └── image/                 # 图像生成组件
        ├── index.tsx          # 主图像生成组件
        ├── model-select.tsx   # 模型选择
        └── prompt-input.tsx   # 提示词输入
```

## [⚙️ AI 模型配置](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-ai-%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)
### [核心配置文件](https://nextdevkit.com/zh/docs/ai-integration#%E6%A0%B8%E5%BF%83%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
NEXTDEVKIT 使用 Vercel AI SDK 的 Provider Registry 系统：
src/ai/index.ts
```
import { google } from "@ai-sdk/google";
import { createProviderRegistry, customProvider } from "ai";
// 默认模型 ID
export const DEFAULT_FAST_MODEL_ID = "google:fast";
export const DEFAULT_CHAT_MODEL_ID = "google:chat";  
export const DEFAULT_IMAGE_MODEL_ID = "google:image";
export const DEFAULT_REASONING_MODEL_ID = "google:reasoning";
export const registry = createProviderRegistry({
  google: customProvider({
    languageModels: {
      fast: google("gemini-2.5-flash-lite"),    // 快速模型
      chat: google("gemini-2.5-flash"),         // 标准聊天
      reasoning: google("gemini-2.5-pro"),      // 推理模型
    },
    imageModels: {
      image: google.imageModel("imagen-3.0-generate-002"), // 图像生成
    },
    fallbackProvider: google,
  }),
});
```

### [支持的模型类型](https://nextdevkit.com/zh/docs/ai-integration#%E6%94%AF%E6%8C%81%E7%9A%84%E6%A8%A1%E5%9E%8B%E7%B1%BB%E5%9E%8B)
模型类型 | 模型名称 | 用途 | API 成本  
---|---|---|---  
**fast** | gemini-2.5-flash-lite | 快速响应，低成本 | 最低  
**chat** | gemini-2.5-flash | 日常对话，平衡性能 | 中等  
**reasoning** | gemini-2.5-pro | 复杂推理，高质量 | 最高  
**image** | imagen-3.0-generate-002 | 图像生成 | 按图片计费  
### [模型配置管理](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE%E7%AE%A1%E7%90%86)
NEXTDEVKIT 使用专门的模型配置文件来管理不同类型的 AI 模型：
#### [聊天模型配置](https://nextdevkit.com/zh/docs/ai-integration#%E8%81%8A%E5%A4%A9%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)
src/ai/models/chat.ts
```
export interface ChatModel {
  id: string;          // 模型标识符
  name: string;        // 显示名称
  description: string; // 模型描述
}
export const chatModels: Array<ChatModel> = [
  {
    id: DEFAULT_FAST_MODEL_ID,
    name: "最快模型",
    description: "最具成本效益的高吞吐量模型",
  },
  {
    id: DEFAULT_CHAT_MODEL_ID,
    name: "聊天模型", 
    description: "自适应思维，成本效率",
  },
  {
    id: DEFAULT_REASONING_MODEL_ID,
    name: "推理模型",
    description: "增强思维和推理，多模态理解，高级编程能力",
  },
];
```

#### [图像模型配置](https://nextdevkit.com/zh/docs/ai-integration#%E5%9B%BE%E5%83%8F%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)
src/ai/models/image.ts
```
export interface ImageModel {
  id: string;      // 模型标识符
  name: string;    // 显示名称
  description: string; // 模型描述
  modelId: string; // 实际的模型 ID
}
export const imageModels: Array<ImageModel> = [
  {
    id: DEFAULT_IMAGE_MODEL_ID,
    name: "Imagen 3.0",
    description: "Google 先进的图像生成模型",
    modelId: "imagen-3.0-generate-002",
  },
];
```

#### [模型配置的用途](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE%E7%9A%84%E7%94%A8%E9%80%94)
这些配置文件主要用于：
  1. **UI 模型选择器** : 在聊天和图像生成界面中显示可用模型
```
// 在组件中使用
import { chatModels } from "@/ai/models/chat";
const selectedModel = chatModels.find(
  (model) => model.id === selectedModelId
);
```

  2. **模型下拉菜单** : 渲染模型选择列表
```
{chatModels.map((model) => (
  <SelectItem key={model.id} value={model.name}>
    <div className="flex flex-col gap-1">
      <span className="font-medium">{model.name}</span>
      <span className="text-sm text-muted-foreground">
        {model.description}
      </span>
    </div>
  </SelectItem>
))}
```

  3. **默认模型设置** : 提供默认选择的模型
```
const defaultModel = imageModels[0]; // 使用第一个模型作为默认
```



## [🔧 核心功能实现](https://nextdevkit.com/zh/docs/ai-integration#-%E6%A0%B8%E5%BF%83%E5%8A%9F%E8%83%BD%E5%AE%9E%E7%8E%B0)
### [💬 聊天机器人](https://nextdevkit.com/zh/docs/ai-integration#-%E8%81%8A%E5%A4%A9%E6%9C%BA%E5%99%A8%E4%BA%BA)
#### [API 实现](https://nextdevkit.com/zh/docs/ai-integration#api-%E5%AE%9E%E7%8E%B0)
src/app/api/ai/demo/chat/route.ts
```
import { streamText, convertToModelMessages } from "ai";
import { registry, DEFAULT_REASONING_MODEL_ID } from "@/ai";
import { systemPrompt } from "@/ai/prompts";
import { getWeather } from "@/ai/agents/get-weather";
export async function POST(request: NextRequest) {
  const { messages, selectedChatModel } = await request.json();
  const result = streamText({
    model: registry.languageModel(selectedChatModel),
    system: systemPrompt({ selectedChatModel }),
    messages: convertToModelMessages(messages),
    tools: {
      getWeather, // 天气查询工具
    },
  });
  return result.toUIMessageStreamResponse({
    sendReasoning: selectedChatModel === DEFAULT_REASONING_MODEL_ID,
  });
}
```

#### [聊天组件](https://nextdevkit.com/zh/docs/ai-integration#%E8%81%8A%E5%A4%A9%E7%BB%84%E4%BB%B6)
src/components/examples/ai/chat/index.tsx
```
"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
export function Chat({ id, initialMessages, initialChatModel }) {
  const { messages, sendMessage, status } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/ai/demo/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: { 
            id, 
            messages, 
            selectedChatModel: initialChatModel 
          }
        };
      },
    }),
  });
  return (
    <div className="chat-container">
      <Messages messages={messages} />
      <MultimodalInput onSend={sendMessage} />
    </div>
  );
}
```

### [🖼️ 图像生成](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-%E5%9B%BE%E5%83%8F%E7%94%9F%E6%88%90)
#### [API 实现](https://nextdevkit.com/zh/docs/ai-integration#api-%E5%AE%9E%E7%8E%B0-1)
src/app/api/ai/demo/image/route.ts
```
import { experimental_generateImage as generateImage } from "ai";
import { registry, DEFAULT_IMAGE_MODEL_ID } from "@/ai";
export async function POST(req: NextRequest) {
  const { prompt, provider, modelId } = await req.json();
  const config = providerConfig[provider];
  const result = await generateImage({
    model: config.createImageModel,
    prompt,
    size: "1024x1024",
    seed: Math.floor(Math.random() * 1000000),
    providerOptions: { 
      vertex: { addWatermark: false } // Vertex AI 配置
    }
  });
  return NextResponse.json({
    provider,
    image: result.image.base64,
  });
}
```

#### [图像生成组件](https://nextdevkit.com/zh/docs/ai-integration#%E5%9B%BE%E5%83%8F%E7%94%9F%E6%88%90%E7%BB%84%E4%BB%B6)
src/components/examples/ai/image/index.tsx
```
"use client";
import { useImageGeneration } from "@/ai/image/use-image-generation";
export function GenerateImage({ suggestions }) {
  const { 
    images, 
    isLoading, 
    startGeneration
  } = useImageGeneration();
  const handlePromptSubmit = (prompt: string) => {
    const providerToModel = { google: "imagen-3.0-generate-002" };
    startGeneration(prompt, ["google"], providerToModel);
  };
  return (
    <div className="max-w-4xl mx-auto">
      <PromptInput
        onSubmit={handlePromptSubmit}
        isLoading={isLoading}
        suggestions={suggestions}
      />
      <ImageResults images={images} />
    </div>
  );
}
```

## [🛠️ 实现步骤](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4)
### [第一步：安装依赖](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E4%B8%80%E6%AD%A5%E5%AE%89%E8%A3%85%E4%BE%9D%E8%B5%96)
NEXTDEVKIT 已预装以下 AI 相关依赖：
```
{
  "dependencies": {
    "@ai-sdk/google": "^2.0.12",
    "@ai-sdk/react": "^2.0.33", 
    "ai": "^5.0.33"
  }
}
```

如需添加其他提供商：
```
# OpenAI
pnpm add @ai-sdk/openai
# Anthropic  
pnpm add @ai-sdk/anthropic
# Azure OpenAI
pnpm add @ai-sdk/azure
```

### [第二步：配置环境变量](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E4%BA%8C%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
确保 `.env` 文件包含：
```
# Google AI Key
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
# 可选：其他提供商
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### [第三步：扩展模型配置](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E4%B8%89%E6%AD%A5%E6%89%A9%E5%B1%95%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)
在配置文件中添加新提供商：
src/ai/index.ts
```
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
export const registry = createProviderRegistry({
  google: customProvider({
    languageModels: {
      fast: google("gemini-2.5-flash-lite"),
      chat: google("gemini-2.5-flash"),
    },
  }),
  openai: customProvider({
    languageModels: {
      chat: openai("gpt-4"),
      fast: openai("gpt-3.5-turbo"),
    },
  }),
  anthropic: customProvider({
    languageModels: {
      chat: anthropic("claude-3-sonnet-20240229"),
    },
  }),
});
```

### [第四步：添加新模型到界面](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E5%9B%9B%E6%AD%A5%E6%B7%BB%E5%8A%A0%E6%96%B0%E6%A8%A1%E5%9E%8B%E5%88%B0%E7%95%8C%E9%9D%A2)
添加新的 AI 模型后，需要更新模型配置文件以在界面中显示：
#### [添加新的聊天模型](https://nextdevkit.com/zh/docs/ai-integration#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E8%81%8A%E5%A4%A9%E6%A8%A1%E5%9E%8B)
src/ai/index.ts
```
// 首先定义新的模型 ID 常量
export const DEFAULT_OPENAI_MODEL_ID = "openai:chat";
export const DEFAULT_ANTHROPIC_MODEL_ID = "anthropic:chat";
```

src/ai/models/chat.ts
```
import {
  DEFAULT_CHAT_MODEL_ID,
  DEFAULT_FAST_MODEL_ID, 
  DEFAULT_REASONING_MODEL_ID,
  DEFAULT_OPENAI_MODEL_ID,    // 新增
  DEFAULT_ANTHROPIC_MODEL_ID, // 新增
} from "@/ai";
export const chatModels: Array<ChatModel> = [
  {
    id: DEFAULT_FAST_MODEL_ID,
    name: "最快模型",
    description: "最具成本效益的高吞吐量模型",
  },
  {
    id: DEFAULT_CHAT_MODEL_ID,
    name: "聊天模型",
    description: "自适应思维，成本效率",
  },
  {
    id: DEFAULT_REASONING_MODEL_ID,
    name: "推理模型",
    description: "增强思维和推理，多模态理解，高级编程能力",
  },
  // 新增的模型
  {
    id: DEFAULT_OPENAI_MODEL_ID,
    name: "GPT-4",
    description: "OpenAI 的强大语言模型",
  },
  {
    id: DEFAULT_ANTHROPIC_MODEL_ID,
    name: "Claude 3 Sonnet",
    description: "Anthropic 的平衡性能模型",
  },
];
```

#### [添加新的图像模型](https://nextdevkit.com/zh/docs/ai-integration#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E5%9B%BE%E5%83%8F%E6%A8%A1%E5%9E%8B)
src/ai/index.ts
```
// 定义新的图像模型 ID
export const OPENAI_IMAGE_MODEL_ID = "openai:image";
// 在 registry 中添加图像模型
export const registry = createProviderRegistry({
  openai: customProvider({
    languageModels: {
      chat: openai("gpt-4"),
    },
    imageModels: {
      image: openai.imageModel("dall-e-3"), // 新增图像模型
    },
  }),
});
```

src/ai/models/image.ts
```
import { DEFAULT_IMAGE_MODEL_ID, OPENAI_IMAGE_MODEL_ID } from "@/ai";
export const imageModels: Array<ImageModel> = [
  {
    id: DEFAULT_IMAGE_MODEL_ID,
    name: "Imagen 3.0",
    description: "Google 先进的图像生成模型",
    modelId: "imagen-3.0-generate-002",
  },
  // 新增的图像模型
  {
    id: OPENAI_IMAGE_MODEL_ID,
    name: "DALL-E 3",
    description: "OpenAI 的图像生成模型",
    modelId: "dall-e-3",
  },
];
```

#### [模型 ID 命名规范](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B-id-%E5%91%BD%E5%90%8D%E8%A7%84%E8%8C%83)
遵循以下命名规范确保配置一致性：
  1. **提供商前缀** : `{provider}:{type}` 格式
     * `google:fast` - Google 的快速模型
     * `openai:chat` - OpenAI 的聊天模型
     * `anthropic:reasoning` - Anthropic 的推理模型
  2. **常量命名** : 使用 `DEFAULT_` 或 `{PROVIDER}_` 前缀
```
export const DEFAULT_FAST_MODEL_ID = "google:fast";
export const OPENAI_CHAT_MODEL_ID = "openai:chat"; 
export const ANTHROPIC_REASONING_MODEL_ID = "anthropic:reasoning";
```

  3. **模型配置匹配** : 确保 `id` 字段与注册表中的键匹配
```
// registry 中的配置
languageModels: {
  fast: google("gemini-2.5-flash-lite"), // 对应 "google:fast"
  chat: openai("gpt-4"),                 // 对应 "openai:chat"
}
// models 配置中的 ID
{ id: "google:fast", name: "...", description: "..." }
{ id: "openai:chat", name: "...", description: "..." }
```



## [🔄 高级功能](https://nextdevkit.com/zh/docs/ai-integration#-%E9%AB%98%E7%BA%A7%E5%8A%9F%E8%83%BD)
### [🧠 推理模式](https://nextdevkit.com/zh/docs/ai-integration#-%E6%8E%A8%E7%90%86%E6%A8%A1%E5%BC%8F)
支持 Gemini 2.5 Pro 的思维链推理：
```
reasoning: wrapLanguageModel({
  model: google("gemini-2.5-pro"),
  middleware: [
    defaultSettingsMiddleware({
      settings: {
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 8192,      // 思考令牌预算
              includeThoughts: true,     // 包含思考过程
            },
          },
        },
      },
    }),
    extractReasoningMiddleware({ tagName: "think" }), // 提取推理过程
  ],
})
```

### [🛠️ 工具调用 (Function Calling)](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-%E5%B7%A5%E5%85%B7%E8%B0%83%E7%94%A8-function-calling)
定义智能体工具：
src/ai/agents/get-weather.ts
```
import { z } from "zod";
export const getWeather = {
  description: "获取指定城市的天气信息",
  parameters: z.object({
    location: z.string().describe("城市名称"),
  }),
  execute: async ({ location }: { location: string }) => {
    // 调用天气 API
    const weather = await fetchWeatherData(location);
    return `${location}的天气：${weather.condition}，温度${weather.temperature}°C`;
  },
};
```

在聊天中启用工具：
```
const result = streamText({
  model: registry.languageModel(selectedChatModel),
  messages: convertToModelMessages(messages),
  experimental_activeTools: ["getWeather"], // 激活工具
  tools: { getWeather },
});
```

## [🔒 安全和性能](https://nextdevkit.com/zh/docs/ai-integration#-%E5%AE%89%E5%85%A8%E5%92%8C%E6%80%A7%E8%83%BD)
### [用户身份验证](https://nextdevkit.com/zh/docs/ai-integration#%E7%94%A8%E6%88%B7%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)
所有 AI API 端点都需要身份验证（默认没有开启）:
```
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }
  // 继续处理请求...
}
```

### [请求超时管理](https://nextdevkit.com/zh/docs/ai-integration#%E8%AF%B7%E6%B1%82%E8%B6%85%E6%97%B6%E7%AE%A1%E7%90%86)
防止长时间运行的请求：
```
const TIMEOUT_MILLIS = 55 * 1000; // 55秒
const withTimeout = <T>(promise: Promise<T>, timeoutMillis: number) => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMillis)
    ),
  ]);
};
const result = await withTimeout(generatePromise, TIMEOUT_MILLIS);
```

### [错误处理](https://nextdevkit.com/zh/docs/ai-integration#%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86)
统一的错误处理系统 (`src/ai/errors.ts`)：
```
export class ChatSDKError extends Error {
  constructor(
    public code: "unauthorized:chat" | "rate-limited" | "model-error",
    message?: string
  ) {
    super(message ?? code);
    this.name = "ChatSDKError";
  }
  toResponse() {
    return Response.json(
      { error: this.code, message: this.message },
      { status: this.getStatusCode() }
    );
  }
  private getStatusCode() {
    switch (this.code) {
      case "unauthorized:chat": return 401;
      case "rate-limited": return 429;
      default: return 500;
    }
  }
}
```

## [🚨 故障排除](https://nextdevkit.com/zh/docs/ai-integration#-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/ai-integration#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
  1. **API 密钥无效**
```
Error: Invalid API key for Google Generative AI
```

     * 检查 `.env` 文件中的 `GOOGLE_GENERATIVE_AI_API_KEY`
     * 确保 API 密钥有效且有足够配额
  2. **模型访问受限**
```
Error: Model 'gemini-2.5-pro' not available
```

     * 某些模型需要申请访问权限
     * 检查 Google AI Studio 中的可用模型列表
  3. **图像生成失败**
```
Error: Image generation timed out
```

     * Imagen 模型响应较慢，已设置 55 秒超时
     * 简化提示词或重试生成


### [调试技巧](https://nextdevkit.com/zh/docs/ai-integration#%E8%B0%83%E8%AF%95%E6%8A%80%E5%B7%A7)
启用详细日志：
```
// 在 API 路由中添加
console.log("Request details:", {
  messages: messages.length,
  model: selectedChatModel,
  timestamp: new Date().toISOString()
});
```

检查模型注册：
```
// 验证模型是否正确注册
console.log("Available models:", Object.keys(registry.languageModels));
```

## [💰 成本优化](https://nextdevkit.com/zh/docs/ai-integration#-%E6%88%90%E6%9C%AC%E4%BC%98%E5%8C%96)
### [模型选择策略](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B%E9%80%89%E6%8B%A9%E7%AD%96%E7%95%A5)
  * **日常对话** : 使用 `gemini-2.5-flash-lite` (最低成本)
  * **复杂查询** : 使用 `gemini-2.5-flash` (平衡性能)
  * **专业分析** : 使用 `gemini-2.5-pro` (最高质量)


### [令牌管理](https://nextdevkit.com/zh/docs/ai-integration#%E4%BB%A4%E7%89%8C%E7%AE%A1%E7%90%86)
```
const result = streamText({
  model: registry.languageModel(selectedChatModel),
  messages: convertToModelMessages(messages),
  maxTokens: selectedChatModel.includes("pro") ? 4096 : 2048, // 根据模型调整
  temperature: 0.7,
});
```

## [🔗 相关资源](https://nextdevkit.com/zh/docs/ai-integration#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
[API 参考 积分系统函数和服务器操作的完整 API 参考](https://nextdevkit.com/zh/docs/credits/api-reference)[分析统计 学习如何在 NEXTDEVKIT 中通过 Cookie 同意实现分析跟踪](https://nextdevkit.com/zh/docs/analytics)
[](https://nextdevkit.com/zh/docs/ai-integration#-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)[**配置 Google Gemini API**](https://nextdevkit.com/zh/docs/ai-integration#1-%E9%85%8D%E7%BD%AE-google-gemini-api)[**启动应用**](https://nextdevkit.com/zh/docs/ai-integration#2-%E5%90%AF%E5%8A%A8%E5%BA%94%E7%94%A8)[](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-ai-%E5%8A%9F%E8%83%BD%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-ai-%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%A0%B8%E5%BF%83%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%94%AF%E6%8C%81%E7%9A%84%E6%A8%A1%E5%9E%8B%E7%B1%BB%E5%9E%8B)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/ai-integration#%E8%81%8A%E5%A4%A9%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/ai-integration#%E5%9B%BE%E5%83%8F%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE%E7%9A%84%E7%94%A8%E9%80%94)[](https://nextdevkit.com/zh/docs/ai-integration#-%E6%A0%B8%E5%BF%83%E5%8A%9F%E8%83%BD%E5%AE%9E%E7%8E%B0)[](https://nextdevkit.com/zh/docs/ai-integration#-%E8%81%8A%E5%A4%A9%E6%9C%BA%E5%99%A8%E4%BA%BA)[](https://nextdevkit.com/zh/docs/ai-integration#api-%E5%AE%9E%E7%8E%B0)[](https://nextdevkit.com/zh/docs/ai-integration#%E8%81%8A%E5%A4%A9%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-%E5%9B%BE%E5%83%8F%E7%94%9F%E6%88%90)[](https://nextdevkit.com/zh/docs/ai-integration#api-%E5%AE%9E%E7%8E%B0-1)[](https://nextdevkit.com/zh/docs/ai-integration#%E5%9B%BE%E5%83%8F%E7%94%9F%E6%88%90%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E4%B8%80%E6%AD%A5%E5%AE%89%E8%A3%85%E4%BE%9D%E8%B5%96)[](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E4%BA%8C%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E4%B8%89%E6%AD%A5%E6%89%A9%E5%B1%95%E6%A8%A1%E5%9E%8B%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/ai-integration#%E7%AC%AC%E5%9B%9B%E6%AD%A5%E6%B7%BB%E5%8A%A0%E6%96%B0%E6%A8%A1%E5%9E%8B%E5%88%B0%E7%95%8C%E9%9D%A2)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E8%81%8A%E5%A4%A9%E6%A8%A1%E5%9E%8B)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E5%9B%BE%E5%83%8F%E6%A8%A1%E5%9E%8B)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B-id-%E5%91%BD%E5%90%8D%E8%A7%84%E8%8C%83)[](https://nextdevkit.com/zh/docs/ai-integration#-%E9%AB%98%E7%BA%A7%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/ai-integration#-%E6%8E%A8%E7%90%86%E6%A8%A1%E5%BC%8F)[](https://nextdevkit.com/zh/docs/ai-integration#%EF%B8%8F-%E5%B7%A5%E5%85%B7%E8%B0%83%E7%94%A8-function-calling)[](https://nextdevkit.com/zh/docs/ai-integration#-%E5%AE%89%E5%85%A8%E5%92%8C%E6%80%A7%E8%83%BD)[](https://nextdevkit.com/zh/docs/ai-integration#%E7%94%A8%E6%88%B7%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)[](https://nextdevkit.com/zh/docs/ai-integration#%E8%AF%B7%E6%B1%82%E8%B6%85%E6%97%B6%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/ai-integration#%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86)[](https://nextdevkit.com/zh/docs/ai-integration#-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/ai-integration#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/ai-integration#%E8%B0%83%E8%AF%95%E6%8A%80%E5%B7%A7)[](https://nextdevkit.com/zh/docs/ai-integration#-%E6%88%90%E6%9C%AC%E4%BC%98%E5%8C%96)[](https://nextdevkit.com/zh/docs/ai-integration#%E6%A8%A1%E5%9E%8B%E9%80%89%E6%8B%A9%E7%AD%96%E7%95%A5)[](https://nextdevkit.com/zh/docs/ai-integration#%E4%BB%A4%E7%89%8C%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/ai-integration#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
