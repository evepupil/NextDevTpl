# 来源: https://nextdevkit.com/zh/docs/email

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
如何发送邮件📦 三类邮件分类
# 如何发送邮件
深入学习如何在 NextDevKit 中使用 Resend + React Email 发送邮件和管理 Newsletter，掌握邮件系统的完整功能。
在前面的 Auth 教程中，我们已经接触过邮件功能，比如发送验证邮件、重置密码邮件等。现在让我们从基础开始，深入学习 React Email 的核心概念，然后掌握 NextDevKit 的完整邮件系统。
## [📦 三类邮件分类](https://nextdevkit.com/zh/docs/email#-%E4%B8%89%E7%B1%BB%E9%82%AE%E4%BB%B6%E5%88%86%E7%B1%BB)
在深入了解如何实现邮件服务的技术细节之前，我们先来了解一下传统的 SaaS 服务需要哪些邮件，邮件的分类有哪些。
传统的 SaaS 服务大多数邮件分为三种类别，每类有不同的用途和最佳实践：
**1. Operational Email（操作邮件）**
  * 系统自动触发，用户必须接收
  * 例如：邮箱验证、密码重置、登录通知
  * 特点：时效性强、内容简洁、包含明确的行动按钮


**2. Transactional Email（交易邮件）**
  * 基于用户行为触发，包含交易信息
  * 例如：订单确认、支付收据、联系表单确认
  * 特点：信息详细、格式规范、需要存档


**3. Marketing Email（营销邮件）**
  * 用户可选择接收，营销导向
  * 例如：欢迎邮件、Newsletter、产品更新
  * 特点：设计精美、内容丰富、包含退订选项


NextDevKit 默认只内置了 Operational Email 的邮件模版，Transactional Email 和 Marketing Email 的邮件模版并没有默认实现，因为建议根据自己的业务需求来实现，不同的业务在这方面确实有不同的设计。
通过 NextDevKit 的内置邮件系统，你可以轻松实现这三类邮件模板，也可以很快搭建对应的邮件模版。
## [🤔 为什么需要 React Email？](https://nextdevkit.com/zh/docs/email#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81-react-email)
在我们了解需要哪些邮件服务后，我们来看看为什么需要 React Email 来开发邮件模版。
### [传统 HTML 邮件的痛点](https://nextdevkit.com/zh/docs/email#%E4%BC%A0%E7%BB%9F-html-%E9%82%AE%E4%BB%B6%E7%9A%84%E7%97%9B%E7%82%B9)
传统的邮件开发面临诸多挑战：
**1. 兼容性噩梦**
  * 不同邮件客户端（Outlook、Gmail、Apple Mail）对 CSS 支持差异巨大
  * 需要使用过时的 HTML 表格布局
  * 响应式设计实现困难


**2. 开发效率低下**
  * 纯 HTML 模板难以维护和复用
  * 动态内容插入容易出错
  * 缺乏类型安全和开发工具支持


**3. 测试和预览困难**
  * 需要在多个邮件客户端中手动测试
  * 调试样式问题耗时巨大


### [React Email 的解决方案](https://nextdevkit.com/zh/docs/email#react-email-%E7%9A%84%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
**React Email** 通过以下方式解决了这些问题：
✅ **组件化开发** ：使用熟悉的 React 语法构建邮件模板  
✅ **跨客户端兼容** ：自动生成兼容各大邮件客户端的 HTML  
✅ **TypeScript 支持** ：完整的类型安全和 IntelliSense  
✅ **实时预览** ：内置开发服务器，实时预览邮件效果  
✅ **响应式设计** ：内置响应式组件，自动适配移动端
对比：传统 vs React Email
```
// ❌ 传统 HTML 邮件
`<table style="width:100%;">
  <tr>
    <td style="padding:20px;">
      <h1 style="color:#333;">Welcome ${userName}!</h1>
      <a href="${link}" style="background:#007bff;color:white;">Get Started</a>
    </td>
  </tr>
</table>`
// ✅ React Email 组件
<Container style={{padding: '20px'}}>
  <Heading>Welcome {userName}!</Heading>
  <Button href={link}>Get Started</Button>
</Container>
```

## [🎨 Tailwind CSS + React Email](https://nextdevkit.com/zh/docs/email#-tailwind-css--react-email)
NextDevKit 本身集成 Tailwind CSS 来作为默认内置的 CSS 框架来开发组件样式，所以使用 Tailwind CSS 来开发邮件模板是更统一的开发体验。
NextDevKit 采用了现代化的 **Tailwind CSS + React Email** 方案，这个组合带来了前所未有的开发体验。
### [为什么选择 Tailwind CSS？](https://nextdevkit.com/zh/docs/email#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-tailwind-css)
传统邮件开发需要写大量内联样式，维护困难。Tailwind CSS 通过预定义的 utility 类解决了这个问题：
传统方式 vs Tailwind
```
// ❌ 传统内联样式
<Text style={{ 
  fontSize: "18px", 
  fontWeight: "600", 
  marginBottom: "16px",
  color: "#6b7280"
}}>
// ✅ Tailwind CSS 类名
<Text className="text-lg font-semibold mb-4 text-muted-foreground">
```

### [关键优势](https://nextdevkit.com/zh/docs/email#%E5%85%B3%E9%94%AE%E4%BC%98%E5%8A%BF)
**1. 开发效率** ：预定义类名，快速样式化  
**2. 一致性** ：设计系统内置，避免样式不一致  
**3. 响应式** ：内置响应式修饰符  
**4. 维护性** ：类名语义化，易于理解和修改
### [React Email 核心组件](https://nextdevkit.com/zh/docs/email#react-email-%E6%A0%B8%E5%BF%83%E7%BB%84%E4%BB%B6)
React Email 提供了邮件专用的组件，确保跨客户端兼容性：
**布局组件** ：`Html`, `Head`, `Body`, `Container`, `Section`  
**文本组件** ：`Heading`, `Text`, `Link`  
**交互组件** ：`Button`  
**媒体组件** ：`Img`  
**辅助组件** ：`Hr`, `Row`, `Column`
**重要特性** ：
  * ✅ 自动生成表格布局确保兼容性
  * ✅ 内置响应式支持
  * ✅ TypeScript 类型安全
  * ✅ 支持 Tailwind CSS 类名


### [实际使用示例](https://nextdevkit.com/zh/docs/email#%E5%AE%9E%E9%99%85%E4%BD%BF%E7%94%A8%E7%A4%BA%E4%BE%8B)
下面这个例子并非 NextDevKit 内置邮件模版，推荐根据你的业务需求来设计邮件模板。
Tailwind + React Email 实践
```
import { Container, Text, Button, Hr } from "@react-email/components";
<Container className="bg-white p-6 rounded-lg">
  <Text className="text-2xl font-bold text-center mb-4">
    欢迎加入我们！
  </Text>
  <Text className="text-base text-gray-600 mb-6">
    感谢您的注册，让我们开始您的旅程。
  </Text>
  <Hr className="my-6" />
  <div className="text-center">
    <Button
      href="#"
      className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold"
    >
      立即开始 →
    </Button>
  </div>
</Container>
```

**关键点** ：
  * 使用 Tailwind 类名而不是内联样式
  * 响应式类名自动处理移动端适配
  * 语义化类名提高代码可读性


## [🏗️ NextDevKit 邮件系统架构](https://nextdevkit.com/zh/docs/email#%EF%B8%8F-nextdevkit-%E9%82%AE%E4%BB%B6%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)
现在让我们了解 NextDevKit 如何将 React Email 整合到实际项目中：
### [系统设计理念](https://nextdevkit.com/zh/docs/email#%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E7%90%86%E5%BF%B5)
NextDevKit 的邮件系统基于以下理念设计：
**1. 分离关注点** ：模板、发送逻辑、Provider 分离  
**2. 类型安全** ：完整的 TypeScript 支持  
**3. 国际化** ：内置多语言支持  
**4. 可扩展性** ：支持多种邮件服务商和更多邮件模版
### [架构组成](https://nextdevkit.com/zh/docs/email#%E6%9E%B6%E6%9E%84%E7%BB%84%E6%88%90)
**核心模块功能** ：
  * **templates/** ：React Email 模板组件
  * **components/** ：可复用的邮件组件
  * **providers/** ：邮件服务商抽象层
  * **actions.ts** ：Newsletter 相关的 Server Actions
  * **index.ts** ：核心发送函数 `sendEmail`


## [⚙️ 环境配置](https://nextdevkit.com/zh/docs/email#%EF%B8%8F-%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)
### [Resend 设置指南](https://nextdevkit.com/zh/docs/email#resend-%E8%AE%BE%E7%BD%AE%E6%8C%87%E5%8D%97)
**步骤 1: 创建 Resend 账户**  
访问 
**步骤 2: 获取 API Key**  
在 Resend Dashboard → API Keys → 创建新的 API Key（确保勾选 send 权限）。
**步骤 3: 配置环境变量**
.env.local
```
# 必需 - 用于发送邮件
RESEND_API_KEY="re_your_api_key_here"
# 可选 - 仅 Newsletter 功能需要  
RESEND_AUDIENCE_ID="aud_your_audience_id_here"
```

**步骤 4: 应用配置**
src/config/index.ts
```
export const appConfig = {
  mail: {
    provider: "resend",
    from: "noreply@yourcompany.com",    // 你的发送域名  
    contact: "contact@yourcompany.com", // 联系邮箱
  },
} as const;
```

> **关键提示** ：
>   * 生产环境必须使用已验证的域名
>   * 开发阶段可以使用 Resend 提供的测试域名
>   * `RESEND_AUDIENCE_ID` 仅在需要 Newsletter 订阅管理时设置
> 

## [📤 核心发送函数详解](https://nextdevkit.com/zh/docs/email#-%E6%A0%B8%E5%BF%83%E5%8F%91%E9%80%81%E5%87%BD%E6%95%B0%E8%AF%A6%E8%A7%A3)
### [sendEmail 函数签名](https://nextdevkit.com/zh/docs/email#sendemail-%E5%87%BD%E6%95%B0%E7%AD%BE%E5%90%8D)
NextDevKit 提供了统一的 `sendEmail` 函数，支持模板邮件和自定义 HTML 邮件：
sendEmail 函数类型
```
export async function sendEmail<T extends TemplateKey>(
  params: {
    to: string;
    locale?: Locale;
  } & (
    | {
        templateKey: T;  // 使用模板
        context: {...};  // 模板参数
      }
    | {
        subject: string; // 自定义邮件
        html?: string;   // HTML 内容
        text?: string;   // 纯文本内容
      }
  ),
): Promise<boolean>  // 返回发送成功状态
```

### [两种发送方式](https://nextdevkit.com/zh/docs/email#%E4%B8%A4%E7%A7%8D%E5%8F%91%E9%80%81%E6%96%B9%E5%BC%8F)
**方式 1: 使用模板（推荐）**
使用模板发送邮件
```
import { sendEmail } from "@/mail";
// 发送欢迎邮件
const success = await sendEmail({
  to: "user@example.com",
  templateKey: "welcome",
  context: {
    name: "张三",
  },
  locale: "zh", // 可选，支持多语言
});
```

**方式 2: 自定义 HTML**
发送自定义邮件
```
import { sendEmail } from "@/mail";
const success = await sendEmail({
  to: "user@example.com",
  subject: "订单确认",
  html: `<h1>您的订单已确认</h1><p>订单号：#12345</p>`,
  text: "您的订单已确认，订单号：#12345", // 备用纯文本
});
```

### [发送流程解析](https://nextdevkit.com/zh/docs/email#%E5%8F%91%E9%80%81%E6%B5%81%E7%A8%8B%E8%A7%A3%E6%9E%90)
NextDevKit 的邮件发送流程：
  1. **参数验证** ：检查邮箱格式和必需参数
  2. **模板渲染** ：如果使用模板，渲染 React 组件为 HTML
  3. **国际化处理** ：加载对应语言的翻译文件
  4. **Provider 发送** ：通过 Resend 或其他配置的服务商发送
  5. **错误处理** ：返回发送状态，记录错误日志


## [📧 Newsletter 订阅管理](https://nextdevkit.com/zh/docs/email#-newsletter-%E8%AE%A2%E9%98%85%E7%AE%A1%E7%90%86)
### [核心 Newsletter Actions](https://nextdevkit.com/zh/docs/email#%E6%A0%B8%E5%BF%83-newsletter-actions)
NextDevKit 提供了三个核心的 Newsletter 管理 Server Actions：
Newsletter 订阅管理
```
import { subscribeToNewsletter, unsubscribeFromNewsletter, isSubscribedToNewsletter } from "@/mail/actions";
// 1. 订阅 Newsletter
await subscribeToNewsletter({ email: "user@example.com" });
// 2. 取消订阅  
await unsubscribeFromNewsletter({ email: "user@example.com" });
// 3. 检查订阅状态
const isSubscribed = await isSubscribedToNewsletter({ email: "user@example.com" });
```

### [Newsletter 工作原理](https://nextdevkit.com/zh/docs/email#newsletter-%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)
  1. **Resend Audience 集成** ：使用 `RESEND_AUDIENCE_ID` 管理订阅列表
  2. **自动去重** ：重复订阅会更新现有联系人状态
  3. **退订管理** ：支持一键退订和重新订阅
  4. **状态跟踪** ：可查询任意邮箱的订阅状态


**关键配置** ：
  * 确保在 Resend 中创建了 Audience
  * 设置 `RESEND_AUDIENCE_ID` 环境变量
  * Newsletter 模板会在订阅成功后自动发送确认邮件


## [🎨 创建自定义模板](https://nextdevkit.com/zh/docs/email#-%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A8%A1%E6%9D%BF)
如果现有模板不能满足需求，你可以创建自定义邮件模板。
### [自定义模板基本结构](https://nextdevkit.com/zh/docs/email#%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A8%A1%E6%9D%BF%E5%9F%BA%E6%9C%AC%E7%BB%93%E6%9E%84)
src/mail/templates/my-custom-email.tsx
```
import EmailLayout from "@/mail/components/layout";
import EmailButton from "@/mail/components/email-button";
import type { i18nEmailProps } from "@/mail/types";
import { Text, Heading } from "@react-email/components";
import { createTranslator } from "use-intl/core";
export function MyCustomEmail({
  userName,
  actionUrl,
  locale,
  messages,
}: {
  userName: string;
  actionUrl: string;
} & i18nEmailProps) {
  const t = createTranslator({
    locale,
    messages,
  });
  return (
    <EmailLayout>
      <Heading className="text-2xl font-bold">
        自定义邮件标题
      </Heading>
      <Text>
        你好 {userName}，这是一封自定义邮件。
      </Text>
      <EmailButton href={actionUrl}>
        立即行动
      </EmailButton>
    </EmailLayout>
  );
}
```

### [注册和使用模板](https://nextdevkit.com/zh/docs/email#%E6%B3%A8%E5%86%8C%E5%92%8C%E4%BD%BF%E7%94%A8%E6%A8%A1%E6%9D%BF)
**步骤 1: 在`src/mail/templates/index.ts` 中注册**
注册新模板
```
import { MyCustomEmail } from "./my-custom-email";
export const mailTemplates = {
  // ... 其他模板
  myCustomEmail: MyCustomEmail, // 添加新模板
} as const;
```

**步骤 2: 使用新模板**
发送自定义邮件
```
const success = await sendEmail({
  to: "user@example.com",
  templateKey: "myCustomEmail",
  context: {
    userName: "张三",
    actionUrl: "https://example.com/action",
  },
  locale: "zh",
});
```

### [模板设计要点](https://nextdevkit.com/zh/docs/email#%E6%A8%A1%E6%9D%BF%E8%AE%BE%E8%AE%A1%E8%A6%81%E7%82%B9)
**遵循 Tailwind 设计系统** ：
  * 使用 `EmailLayout` 和 `EmailButton` 和更多的自定义邮件组件保持一致性
  * 利用 Tailwind 类名: `mb-6`, `font-semibold`, `text-muted-foreground`
  * 支持国际化：支持多语言


## [🔌 自定义 Email Provider](https://nextdevkit.com/zh/docs/email#-%E8%87%AA%E5%AE%9A%E4%B9%89-email-provider)
除了 Resend，你还可以集成其他邮件服务商。
### [Provider 接口设计](https://nextdevkit.com/zh/docs/email#provider-%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1)
src/mail/types.ts
```
export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean>;
  subscribe?(email: string): Promise<void>;
  unsubscribe?(email: string): Promise<void>;
  isSubscribed?(email: string): Promise<boolean>;
}
```

### [创建自定义 Provider](https://nextdevkit.com/zh/docs/email#%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89-provider)
src/mail/providers/sendgrid.ts
```
import sgMail from "@sendgrid/mail";
import type { EmailProvider } from "@/mail/types";
export class SendGridProvider implements EmailProvider {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }
  async send(params: {
    to: string;
    subject: string; 
    html: string;
    text?: string;
  }): Promise<boolean> {
    try {
      await sgMail.send({
        to: params.to,
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      return true;
    } catch (error) {
      console.error("SendGrid error:", error);
      return false;
    }
  }
  // 可选：实现 Newsletter 功能
  async subscribe(email: string): Promise<void> {
    // 调用 SendGrid Contacts API
  }
}
```

### [注册新 Provider](https://nextdevkit.com/zh/docs/email#%E6%B3%A8%E5%86%8C%E6%96%B0-provider)
src/mail/providers/index.ts
```
import { ResendProvider } from "./resend";
import { SendGridProvider } from "./sendgrid";
export function getMailProvider() {
  const provider = process.env.MAIL_PROVIDER || "resend";
  switch (provider) {
    case "sendgrid":
      return new SendGridProvider();
    case "resend":
    default:
      return new ResendProvider();
  }
}
```

**关键优势** ：
  * **灵活切换** ：通过环境变量控制邮件服务商
  * **统一接口** ：所有 Provider 实现相同接口
  * **渐进迁移** ：可以无缝切换邮件服务商


## [🌍 多语言邮件](https://nextdevkit.com/zh/docs/email#-%E5%A4%9A%E8%AF%AD%E8%A8%80%E9%82%AE%E4%BB%B6)
NextDevKit 内置 i18n 支持，在 `messages/zh.json` 中配置翻译：
messages/zh.json
```
{
  "mail": {
    "welcome": {
      "greeting": "你好 {name}！",
      "intro": "欢迎加入我们的社区。"
    }
  }
}
```

**发送指定语言邮件** ：
```
await sendEmail({
  to: "user@example.com",
  templateKey: "welcome", 
  context: { name: "张三" },
  locale: "zh" // 指定语言
});
```

## [📚 总结](https://nextdevkit.com/zh/docs/email#-%E6%80%BB%E7%BB%93)
现在你已经掌握了 NextDevKit 的现代化邮件系统：
### [🎯 核心收获](https://nextdevkit.com/zh/docs/email#-%E6%A0%B8%E5%BF%83%E6%94%B6%E8%8E%B7)
**Tailwind + React Email** ：摆脱传统内联样式，使用现代化的类名开发邮件模板
**三类邮件设计模式** ：
  * **操作邮件** ：简洁直接，单一行动按钮
  * **交易邮件** ：多步骤结构，丰富信息展示
  * **营销邮件** ：视觉突出，品牌化设计


**系统扩展能力** ：
  * 自定义模板创建和注册
  * 自定义 Provider 集成（SendGrid、Postmark 等）
  * 多语言支持和 Newsletter 管理


**参考资源** ：
[获取 session 信息 学习如何在 NEXTDEVKIT 中使用用户会话](https://nextdevkit.com/zh/docs/authentication/user-session)[对象存储与文件管理 深入学习如何在 NextDevKit 中使用对象存储，掌握预签名 URL、Image Proxy 和文件上传的完整功能。](https://nextdevkit.com/zh/docs/storage)
[](https://nextdevkit.com/zh/docs/email#-%E4%B8%89%E7%B1%BB%E9%82%AE%E4%BB%B6%E5%88%86%E7%B1%BB)[](https://nextdevkit.com/zh/docs/email#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81-react-email)[](https://nextdevkit.com/zh/docs/email#%E4%BC%A0%E7%BB%9F-html-%E9%82%AE%E4%BB%B6%E7%9A%84%E7%97%9B%E7%82%B9)[](https://nextdevkit.com/zh/docs/email#react-email-%E7%9A%84%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)[](https://nextdevkit.com/zh/docs/email#-tailwind-css--react-email)[](https://nextdevkit.com/zh/docs/email#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-tailwind-css)[](https://nextdevkit.com/zh/docs/email#%E5%85%B3%E9%94%AE%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/email#react-email-%E6%A0%B8%E5%BF%83%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/email#%E5%AE%9E%E9%99%85%E4%BD%BF%E7%94%A8%E7%A4%BA%E4%BE%8B)[](https://nextdevkit.com/zh/docs/email#%EF%B8%8F-nextdevkit-%E9%82%AE%E4%BB%B6%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/email#%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E7%90%86%E5%BF%B5)[](https://nextdevkit.com/zh/docs/email#%E6%9E%B6%E6%9E%84%E7%BB%84%E6%88%90)[](https://nextdevkit.com/zh/docs/email#%EF%B8%8F-%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/email#resend-%E8%AE%BE%E7%BD%AE%E6%8C%87%E5%8D%97)[](https://nextdevkit.com/zh/docs/email#-%E6%A0%B8%E5%BF%83%E5%8F%91%E9%80%81%E5%87%BD%E6%95%B0%E8%AF%A6%E8%A7%A3)[](https://nextdevkit.com/zh/docs/email#sendemail-%E5%87%BD%E6%95%B0%E7%AD%BE%E5%90%8D)[](https://nextdevkit.com/zh/docs/email#%E4%B8%A4%E7%A7%8D%E5%8F%91%E9%80%81%E6%96%B9%E5%BC%8F)[](https://nextdevkit.com/zh/docs/email#%E5%8F%91%E9%80%81%E6%B5%81%E7%A8%8B%E8%A7%A3%E6%9E%90)[](https://nextdevkit.com/zh/docs/email#-newsletter-%E8%AE%A2%E9%98%85%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/email#%E6%A0%B8%E5%BF%83-newsletter-actions)[](https://nextdevkit.com/zh/docs/email#newsletter-%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)[](https://nextdevkit.com/zh/docs/email#-%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A8%A1%E6%9D%BF)[](https://nextdevkit.com/zh/docs/email#%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A8%A1%E6%9D%BF%E5%9F%BA%E6%9C%AC%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/email#%E6%B3%A8%E5%86%8C%E5%92%8C%E4%BD%BF%E7%94%A8%E6%A8%A1%E6%9D%BF)[](https://nextdevkit.com/zh/docs/email#%E6%A8%A1%E6%9D%BF%E8%AE%BE%E8%AE%A1%E8%A6%81%E7%82%B9)[](https://nextdevkit.com/zh/docs/email#-%E8%87%AA%E5%AE%9A%E4%B9%89-email-provider)[](https://nextdevkit.com/zh/docs/email#provider-%E6%8E%A5%E5%8F%A3%E8%AE%BE%E8%AE%A1)[](https://nextdevkit.com/zh/docs/email#%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89-provider)[](https://nextdevkit.com/zh/docs/email#%E6%B3%A8%E5%86%8C%E6%96%B0-provider)[](https://nextdevkit.com/zh/docs/email#-%E5%A4%9A%E8%AF%AD%E8%A8%80%E9%82%AE%E4%BB%B6)[](https://nextdevkit.com/zh/docs/email#-%E6%80%BB%E7%BB%93)[](https://nextdevkit.com/zh/docs/email#-%E6%A0%B8%E5%BF%83%E6%94%B6%E8%8E%B7)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
