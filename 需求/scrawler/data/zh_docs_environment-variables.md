# 来源: https://nextdevkit.com/zh/docs/environment-variables

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
环境变量参考理解环境变量
# 环境变量参考
全面了解、配置和管理 NEXTDEVKIT 在不同部署平台上的所有环境变量的完整指南。
本指南提供了 NEXTDEVKIT 使用的所有环境变量的完整参考。你将学习每个变量的作用、何时需要它以及如何获取所需的值。
## [理解环境变量](https://nextdevkit.com/zh/docs/environment-variables#%E7%90%86%E8%A7%A3%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
环境变量是根据应用程序运行位置(开发环境、预发布环境、生产环境)而变化的配置值。它们将 API 密钥和数据库凭据等敏感信息与代码分离。
### [安全原则](https://nextdevkit.com/zh/docs/environment-variables#%E5%AE%89%E5%85%A8%E5%8E%9F%E5%88%99)
安全第一
  * **永远不要** 将 `.env` 文件提交到版本控制
  * 开发和生产环境使用不同的值
  * 定期轮换密钥
  * 为不同环境使用专门的 OAuth 回调地址


### [文件组织](https://nextdevkit.com/zh/docs/environment-variables#%E6%96%87%E4%BB%B6%E7%BB%84%E7%BB%87)
```
your-project/
├── .env.local              # 本地开发环境 (已 git 忽略)
├── .env.production         # 生产环境值 (已 git 忽略)
└── .env.example            # 示例模板,使用虚拟值 (已提交)
```

## [渐进式配置之旅](https://nextdevkit.com/zh/docs/environment-variables#%E6%B8%90%E8%BF%9B%E5%BC%8F%E9%85%8D%E7%BD%AE%E4%B9%8B%E6%97%85)
让我们逐步配置环境变量,从最基础的必需配置开始,逐步添加功能。
### [第 1 级:最小设置(5 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-1-%E7%BA%A7%E6%9C%80%E5%B0%8F%E8%AE%BE%E7%BD%AE5-%E5%88%86%E9%92%9F)
**目标:** 让 NEXTDEVKIT 在本地运行,具备核心功能。
**你需要的:**
  * 认证密钥
  * 数据库连接
  * 公共 URL


#### [生成认证密钥](https://nextdevkit.com/zh/docs/environment-variables#%E7%94%9F%E6%88%90%E8%AE%A4%E8%AF%81%E5%AF%86%E9%92%A5)
终端
```
openssl rand -base64 32
```

这会生成一个随机的 32 字符密钥用于加密会话。
**添加到`.env.local` :**
.env.local
```
# 核心认证
BETTER_AUTH_SECRET=你生成的密钥
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**为什么需要这些:**
  * `BETTER_AUTH_SECRET`: 加密用户会话和令牌
  * `BETTER_AUTH_URL`: 认证回调的基础 URL
  * `NEXT_PUBLIC_APP_URL`: 面向公众的应用程序 URL(暴露给浏览器)


以 `NEXT_PUBLIC_` 为前缀的变量会暴露给浏览器。永远不要在其中放置密钥!
#### [配置数据库连接](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5)
**对于 PostgreSQL(生产环境推荐):**
.env.local
```
# 数据库
DATABASE_URL=postgresql://用户名:密码@主机:5432/数据库?sslmode=require
```

**获取数据库 URL:**
  1. **本地 PostgreSQL:**
```
postgresql://postgres:password@localhost:5432/nextdevkit
```

  2. **Neon(提供免费套餐):**
     * 访问 
     * 创建项目 → 复制连接字符串
     * 使用**连接池** 连接字符串
  3. **Supabase:**
     * 访问 
     * 项目设置 → 数据库 → 连接字符串
     * 使用"连接池"字符串


**为什么需要这个:** 数据库存储用户账户、订阅和应用程序数据。
**详细的数据库设置:** [数据库配置](https://nextdevkit.com/docs/database)
#### [运行数据库迁移](https://nextdevkit.com/zh/docs/environment-variables#%E8%BF%90%E8%A1%8C%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)
终端
```
# 生成迁移文件
pnpm db:generate
# 将迁移应用到数据库
pnpm db:migrate
```

**这会做什么:** 创建认证、用户、订阅等所需的表。
**🎉 现在你可以运行:** `pnpm dev`
你的应用现在拥有认证和数据库功能!但你需要更多配置来启用所有功能。
* * *
### [第 2 级:邮件集成(10 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-2-%E7%BA%A7%E9%82%AE%E4%BB%B6%E9%9B%86%E6%88%9010-%E5%88%86%E9%92%9F)
**目标:** 启用密码重置、邮箱验证和邮件订阅。
**你需要的:**
  * 邮件服务提供商 API 密钥


#### [选择邮件提供商](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E6%8B%A9%E9%82%AE%E4%BB%B6%E6%8F%90%E4%BE%9B%E5%95%86)
NEXTDEVKIT 默认支持 **Resend**(推荐,易于使用)。
**为什么选择 Resend:**
  * 免费套餐:每月 3,000 封邮件
  * 不需要信用卡
  * 设置简单
  * 送达率好


**替代方案:**
  * SendGrid
  * AWS SES
  * Postmark


#### [获取 Resend API 密钥](https://nextdevkit.com/zh/docs/environment-variables#%E8%8E%B7%E5%8F%96-resend-api-%E5%AF%86%E9%92%A5)
  1. 访问 
  2. 前往 **API Keys** → **Create API Key**
  3. 命名(例如 "NEXTDEVKIT Development")
  4. 复制密钥(以 `re_` 开头)


**为邮件订阅创建受众:**
  1. 前往 **Audiences** → **Create Audience**
  2. 命名(例如 "NEXTDEVKIT Newsletter")
  3. 复制 Audience ID


#### [添加邮件配置](https://nextdevkit.com/zh/docs/environment-variables#%E6%B7%BB%E5%8A%A0%E9%82%AE%E4%BB%B6%E9%85%8D%E7%BD%AE)
.env.local
```
# 邮件服务
RESEND_API_KEY=re_你的api密钥
RESEND_AUDIENCE_ID=你的受众id
```

**这些启用了:**
  * 密码重置邮件
  * 邮箱验证
  * 邮件订阅
  * 联系表单提交


**📧 现在可用的功能:**
  * 用户可以重置密码
  * 邮件订阅生效
  * 联系表单发送邮件


**查看邮件模板:** [邮件配置](https://nextdevkit.com/docs/email)
* * *
### [第 3 级:社交登录(15 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-3-%E7%BA%A7%E7%A4%BE%E4%BA%A4%E7%99%BB%E5%BD%9515-%E5%88%86%E9%92%9F)
**目标:** 启用"使用 Google/GitHub 登录"按钮。
**为什么添加这个:**
  * 提高转化率(更容易注册)
  * 减少密码疲劳
  * 更好的用户体验


#### [配置 GitHub OAuth](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-github-oauth)
**1. 创建 GitHub OAuth 应用:**
  * 访问 
  * 点击 **OAuth Apps** → **New OAuth App**


**2. 填写详细信息:**
```
Application name: NEXTDEVKIT (Development)
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

**3. 获取凭据:**
  * 点击 **Generate a new client secret**
  * 复制 **Client ID** 和 **Client Secret**


**4. 添加到环境变量:**
.env.local
```
# GitHub OAuth
GITHUB_CLIENT_ID=Ov23xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=你的github客户端密钥
```

为开发、预发布和生产环境创建**独立的 OAuth 应用** ,使用不同的回调 URL!
#### [配置 Google OAuth](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-google-oauth)
**1. 创建 Google Cloud 项目:**
  * 访问 
  * 创建新项目或选择现有项目


**2. 启用 Google+ API:**
  * 前往 **APIs & Services** → **Library**
  * 搜索 "Google+ API" → Enable


**3. 创建 OAuth 凭据:**
  * 前往 **APIs & Services** → **Credentials**
  * 点击 **Create Credentials** → **OAuth client ID**
  * 应用类型:**Web application**


**4. 配置 OAuth 同意屏幕:**
  * 用户类型:External
  * 添加必要信息(应用名称、支持邮箱)


**5. 添加授权来源和重定向 URI:**
```
Authorized JavaScript origins:
http://localhost:3000
Authorized redirect URIs:
http://localhost:3000/api/auth/callback/google
```

**6. 获取凭据:**
.env.local
```
# Google OAuth
GOOGLE_CLIENT_ID=你的客户端id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-你的客户端密钥
```

**🔐 现在可用的功能:**
  * 出现社交登录按钮
  * 一键使用 Google/GitHub 注册
  * 自动从 OAuth 提供商获取头像


**查看认证设置:** [认证配置](https://nextdevkit.com/docs/authentication)
* * *
### [第 4 级:支付集成(20 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-4-%E7%BA%A7%E6%94%AF%E4%BB%98%E9%9B%86%E6%88%9020-%E5%88%86%E9%92%9F)
**目标:** 启用订阅计费和一次性购买。
**你需要的:**
  * Stripe 账户(或 Creem)
  * 产品和价格 ID


#### [选择支付提供商](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E6%8B%A9%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86)
**Stripe(推荐):**
  * 行业标准
  * 优秀的文档
  * 支持大多数国家
  * 高级功能(试用期、计量等)


**Creem:**
  * 记录商户(处理税务合规)
  * 适合全球销售
  * 更简单的税务处理


NEXTDEVKIT 支持这两个提供商。根据你的需求选择。
#### [配置 Stripe](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-stripe)
**1. 创建 Stripe 账户:**
  * 访问 
  * 注册并验证账户


**2. 获取 API 密钥:**
  * 前往 **Developers** → **API keys**
  * 复制 **Secret key**(测试时以 `sk_test_` 开头)


**3. 创建产品:**
在 
**产品 1: Pro 月付**
  * 名称:"Pro Plan - Monthly"
  * 计费:循环
  * 间隔:每月
  * 价格:$9.99/月
  * 试用:7 天(可选)


**产品 2: Pro 年付**
  * 名称:"Pro Plan - Yearly"
  * 计费:循环
  * 间隔:每年
  * 价格:$99/年
  * 试用:30 天(可选)


**产品 3: 终身**
  * 名称:"Lifetime Access"
  * 计费:一次性
  * 价格:$399


**4. 复制价格 ID:**
每个产品都有一个 **Price ID**(以 `price_` 开头)。将这些复制到你的 `.env.local`:
.env.local
```
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_你的stripe密钥
# 订阅价格 ID
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY=price_xxxxxxxxxxxxx
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY=price_xxxxxxxxxxxxx
NEXT_PUBLIC_PRICE_ID_LIFETIME=price_xxxxxxxxxxxxx
```

#### [配置 Webhooks](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-webhooks)
Webhooks 在支付成功或失败时通知你的应用。
**1. 安装 Stripe CLI(用于本地测试):**
终端
```
# macOS
brew install stripe/stripe-cli/stripe
# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
# Linux
# 从 https://github.com/stripe/stripe-cli/releases/latest 下载
```

**2. 登录 Stripe:**
```
stripe login
```

**3. 将 webhooks 转发到本地服务器:**
```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

此命令输出一个 webhook 密钥(以 `whsec_` 开头):
.env.local
```
STRIPE_WEBHOOK_SECRET=whsec_你的本地webhook密钥
```

**4. 对于生产环境:**
  * 前往 Stripe 控制面板中的 **Developers** → **Webhooks**
  * 点击 **Add endpoint**
  * URL:`https://yourdomain.com/api/webhooks/stripe`
  * 选择事件:
    * `checkout.session.completed`
    * `customer.subscription.created`
    * `customer.subscription.updated`
    * `customer.subscription.deleted`
    * `invoice.payment_succeeded`
    * `invoice.payment_failed`


重要
开发和生产环境使用**不同的 webhook 密钥**!
#### [替代方案:配置 Creem](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%BF%E4%BB%A3%E6%96%B9%E6%A1%88%E9%85%8D%E7%BD%AE-creem)
如果你更喜欢使用 Creem 作为支付提供商:
**1. 在**
**2. 获取 API 凭据:**
.env.local
```
# Creem 配置
CREEM_API_KEY=creem_test_你的api密钥
CREEM_WEBHOOK_SECRET=whsec_你的webhook密钥
# 产品 ID(在 Creem 控制面板中创建产品)
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY=prod_你的月付id
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY=prod_你的年付id
NEXT_PUBLIC_PRICE_ID_LIFETIME=prod_你的终身id
```

**3. 在配置中更新支付提供商:**
src/config/index.ts
```
payment: {
  provider: "creem",  // 从 "stripe" 更改
  // ... 其余配置
}
```

**💳 现在可用的功能:**
  * 定价页面生效
  * 用户可以订阅
  * 支付 webhooks 更新用户订阅
  * 管理订阅的账单门户


**查看支付设置:** [支付配置](https://nextdevkit.com/docs/payment)
* * *
### [第 5 级:文件存储(15 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-5-%E7%BA%A7%E6%96%87%E4%BB%B6%E5%AD%98%E5%82%A815-%E5%88%86%E9%92%9F)
**目标:** 启用文件上传(用户头像、文档上传)。
**你需要的:**
  * S3 兼容的存储提供商(AWS S3、Cloudflare R2 等)


#### [选择存储提供商](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E6%8B%A9%E5%AD%98%E5%82%A8%E6%8F%90%E4%BE%9B%E5%95%86)
**Cloudflare R2(大多数用户推荐):**
  * 免费套餐:10GB 存储、每月 100 万次读取
  * 无出站费用
  * S3 兼容 API
  * 快速全球 CDN


**AWS S3:**
  * 行业标准
  * 按使用付费
  * 丰富的功能
  * 全球可用


**替代方案:**
  * DigitalOcean Spaces
  * Backblaze B2
  * Wasabi


#### [配置 Cloudflare R2](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-cloudflare-r2)
**1. 创建 R2 存储桶:**
  * 前往 **R2**
  * 创建存储桶(例如 "nextdevkit-avatars")


**2. 获取 API 令牌:**
  * 前往 **R2** → **Manage R2 API Tokens**
  * 创建具有读/写权限的 API 令牌
  * 复制 **Access Key ID** 和 **Secret Access Key**


**3. 获取账户 ID:**
  * 在 R2 控制面板 URL 或设置中找到


**4. 添加到环境变量:**
.env.local
```
# 存储配置
NEXT_PUBLIC_AVATARS_BUCKET_NAME=nextdevkit-avatars
# Cloudflare R2
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=你的访问密钥id
STORAGE_SECRET_ACCESS_KEY=你的密钥访问密钥
STORAGE_ENDPOINT=https://你的账户id.r2.cloudflarestorage.com
```

对于 Cloudflare Workers 部署,还需添加 `STORAGE_ACCOUNT_ID`。
#### [替代方案:配置 AWS S3](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%BF%E4%BB%A3%E6%96%B9%E6%A1%88%E9%85%8D%E7%BD%AE-aws-s3)
**1. 创建 S3 存储桶:**
  * 前往 
  * 在首选区域创建存储桶


**2. 创建 IAM 用户:**
  * 前往 **IAM** → **Users** → **Create user**
  * 附加策略:`AmazonS3FullAccess`(或创建自定义策略)
  * 创建访问密钥 → 复制凭据


**3. 添加到环境变量:**
.env.local
```
# 存储配置
NEXT_PUBLIC_AVATARS_BUCKET_NAME=nextdevkit-avatars
# AWS S3
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY_ID=AKIA...
STORAGE_SECRET_ACCESS_KEY=你的密钥
# AWS S3 不需要 STORAGE_ENDPOINT
```

**📁 现在可用的功能:**
  * 用户可以上传头像
  * 文件上传组件生效
  * 私有文件的安全签名 URL


**查看存储设置:** [存储配置](https://nextdevkit.com/docs/storage)
* * *
### [第 6 级:数据分析(10 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-6-%E7%BA%A7%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%9010-%E5%88%86%E9%92%9F)
**目标:** 跟踪用户行为和网站性能。
**你需要的:**
  * 分析服务账户(Google Analytics、Umami 或 Plausible)


#### [选项 1: Google Analytics](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E9%A1%B9-1-google-analytics)
**免费、功能丰富、广泛使用**
**1. 创建 GA4 属性:**
  * 访问 
  * 创建账户 → 创建属性(GA4)


**2. 获取 Measurement ID:**
  * 前往 **Admin** → **Data Streams** → 选择你的数据流
  * 复制 **Measurement ID**(以 `G-` 开头)


**3. 添加到环境变量:**
.env.local
```
# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

设置此变量后**自动启用** 。
#### [选项 2: Umami Analytics](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E9%A1%B9-2-umami-analytics)
**注重隐私、可自托管、符合 GDPR**
**1. 选择托管方式:**
  * 自托管:
  * 云服务:


**2. 创建网站:**
  * 在控制面板中添加新网站
  * 复制 **Website ID** 和 **Script URL**


**3. 添加到环境变量:**
.env.local
```
# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=你的网站id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://你的umami实例.com/script.js
```

#### [选项 3: Plausible Analytics](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E9%A1%B9-3-plausible-analytics)
**注重隐私、简单、无 cookie**
**1. 注册:**
  * 访问 
  * 添加你的域名


**2. 获取配置:**
.env.local
```
# Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
```

**📊 现在可用的功能:**
  * 页面浏览跟踪
  * 事件跟踪
  * 用户旅程分析
  * 性能监控


**查看分析设置:** [数据分析配置](https://nextdevkit.com/docs/analytics)
* * *
### [第 7 级:AI 集成(5 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-7-%E7%BA%A7ai-%E9%9B%86%E6%88%905-%E5%88%86%E9%92%9F)
**目标:** 启用 AI 功能(聊天机器人、内容生成)。
**你需要的:**
  * Google AI API 密钥


#### [获取 Google AI API 密钥](https://nextdevkit.com/zh/docs/environment-variables#%E8%8E%B7%E5%8F%96-google-ai-api-%E5%AF%86%E9%92%A5)
**1. 访问 Google AI Studio:**
  * 前往 
  * 使用 Google 账户登录


**2. 创建 API 密钥:**
  * 点击 **Get API key**
  * 在新项目或现有项目中创建
  * 复制密钥(以 `AIza` 开头)


**3. 添加到环境变量:**
.env.local
```
# AI 配置
GOOGLE_GENERATIVE_AI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXX
```

Google AI 有慷慨的免费套餐。在 AI Studio 中监控使用情况。
**🤖 现在可用的功能:**
  * AI 聊天界面
  * 内容生成
  * 智能建议


**查看 AI 设置:** [AI 集成](https://nextdevkit.com/docs/ai-integration)
* * *
### [第 8 级:积分系统(10 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-8-%E7%BA%A7%E7%A7%AF%E5%88%86%E7%B3%BB%E7%BB%9F10-%E5%88%86%E9%92%9F)
**目标:** 启用基于使用量的计费和积分。
**你需要的:**
  * Stripe 积分包产品 ID


#### [在 Stripe 中创建积分产品](https://nextdevkit.com/zh/docs/environment-variables#%E5%9C%A8-stripe-%E4%B8%AD%E5%88%9B%E5%BB%BA%E7%A7%AF%E5%88%86%E4%BA%A7%E5%93%81)
在 
**1. Lite 套餐:**
  * 名称:"Credits - Lite"
  * 价格:$9 一次性
  * 积分:100


**2. Standard 套餐:**
  * 名称:"Credits - Standard"
  * 价格:$29 一次性
  * 积分:300


**3. Pro 套餐:**
  * 名称:"Credits - Pro"
  * 价格:$79 一次性
  * 积分:1,000


**4. Max 套餐:**
  * 名称:"Credits - Max"
  * 价格:$199 一次性
  * 积分:3,000


#### [添加积分价格 ID](https://nextdevkit.com/zh/docs/environment-variables#%E6%B7%BB%E5%8A%A0%E7%A7%AF%E5%88%86%E4%BB%B7%E6%A0%BC-id)
.env.local
```
# 积分系统
CREDIT_LITE_PRICE_ID=price_xxxxxxxxxxxxx
CREDIT_STANDARD_PRICE_ID=price_xxxxxxxxxxxxx
CREDIT_PRO_PRICE_ID=price_xxxxxxxxxxxxx
CREDIT_MAX_PRICE_ID=price_xxxxxxxxxxxxx
```

**🎯 现在可用的功能:**
  * 基于使用量的计费
  * 积分购买流程
  * 积分余额跟踪


**查看积分设置:** [积分系统](https://nextdevkit.com/docs/credits)
* * *
### [第 9 级:定时任务(5 分钟)](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-9-%E7%BA%A7%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A15-%E5%88%86%E9%92%9F)
**目标:** 保护定时任务端点。
**你需要的:**
  * 用于定时任务认证的随机密钥


#### [生成定时任务密钥](https://nextdevkit.com/zh/docs/environment-variables#%E7%94%9F%E6%88%90%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E5%AF%86%E9%92%A5)
终端
```
openssl rand -base64 16
```

**添加到环境变量:**
.env.local
```
# 定时任务安全
CRON_SECRET=你生成的密钥
```

**如何使用:** 定时任务端点检查此密钥以防止未授权访问:
```
// 示例: /api/cron/cleanup
if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**⏰ 保护的功能:**
  * 数据清理任务
  * 报告生成
  * 定时通知


* * *
## [平台特定配置](https://nextdevkit.com/zh/docs/environment-variables#%E5%B9%B3%E5%8F%B0%E7%89%B9%E5%AE%9A%E9%85%8D%E7%BD%AE)
不同的部署平台需要略有不同的环境变量设置。
### [Next.js / Vercel 部署](https://nextdevkit.com/zh/docs/environment-variables#nextjs--vercel-%E9%83%A8%E7%BD%B2)
**最适合:** 传统托管、Vercel 部署、Docker 容器
**第 1-9 级的所有变量** 均可按原样工作。无需特殊配置。
**部署到 Vercel:**
  1. 从 Git 导入项目
  2. 在 **Settings** → **Environment Variables** 中添加环境变量
  3. 部署


**查看详细指南:** [Next.js 部署](https://nextdevkit.com/docs/environment/nextjs)
* * *
### [Cloudflare Workers 部署](https://nextdevkit.com/zh/docs/environment-variables#cloudflare-workers-%E9%83%A8%E7%BD%B2)
**最适合:** 边缘计算、全球分发、成本优化
**主要区别:**
  1. **数据库:** 使用 Cloudflare D1 而不是 PostgreSQL
```
# 移除 DATABASE_URL
# D1 绑定在 wrangler.toml 中配置
```

  2. **存储:** 为 R2 添加账户 ID
```
STORAGE_ACCOUNT_ID=你的cloudflare账户id
```

  3. **在`wrangler.toml` 中配置的额外绑定:**
```
[[d1_databases]]
binding = "DB"
database_name = "nextdevkit"
database_id = "你的数据库id"
```



**查看详细指南:** [Cloudflare Workers 部署](https://nextdevkit.com/docs/environment/cloudflare-worker)
* * *
### [AWS SST 部署](https://nextdevkit.com/zh/docs/environment-variables#aws-sst-%E9%83%A8%E7%BD%B2)
**最适合:** 企业级基础设施、AWS 集成、合规要求
**主要区别:**
  1. **AWS 凭据:**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=你的密钥
```

  2. **RDS 数据库:** 使用 AWS RDS PostgreSQL
```
DATABASE_URL=postgresql://用户名:密码@你的rds实例.区域.rds.amazonaws.com:5432/数据库
```

  3. **S3 存储:** 不需要端点
```
STORAGE_REGION=us-east-1
# 不使用 STORAGE_ENDPOINT
```

  4. **基础设施即代码:** 环境变量可以在 `sst.config.ts` 中定义


**查看详细指南:** [SST AWS 部署](https://nextdevkit.com/docs/environment/sst-aws)
* * *
## [环境变量快速参考](https://nextdevkit.com/zh/docs/environment-variables#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%BF%AB%E9%80%9F%E5%8F%82%E8%80%83)
### [必需变量(最小设置)](https://nextdevkit.com/zh/docs/environment-variables#%E5%BF%85%E9%9C%80%E5%8F%98%E9%87%8F%E6%9C%80%E5%B0%8F%E8%AE%BE%E7%BD%AE)
变量 | 用途 | 示例值  
---|---|---  
`BETTER_AUTH_SECRET` | 会话加密 | `openssl rand -base64 32`  
`BETTER_AUTH_URL` | 认证回调基础 URL | `http://localhost:3000`  
`NEXT_PUBLIC_APP_URL` | 公共应用 URL | `http://localhost:3000`  
`DATABASE_URL` | 数据库连接 | `postgresql://...`  
### [认证](https://nextdevkit.com/zh/docs/environment-variables#%E8%AE%A4%E8%AF%81)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`GITHUB_CLIENT_ID` | GitHub 登录 | OAuth 应用 ID |   
`GITHUB_CLIENT_SECRET` | GitHub 登录 | OAuth 密钥 | GitHub OAuth App  
`GOOGLE_CLIENT_ID` | Google 登录 | OAuth 应用 ID |   
`GOOGLE_CLIENT_SECRET` | Google 登录 | OAuth 密钥 | Google Cloud Console  
### [邮件](https://nextdevkit.com/zh/docs/environment-variables#%E9%82%AE%E4%BB%B6)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`RESEND_API_KEY` | 发送邮件 | API 认证 |   
`RESEND_AUDIENCE_ID` | 邮件订阅 | 邮件列表 ID | Resend Dashboard  
### [支付](https://nextdevkit.com/zh/docs/environment-variables#%E6%94%AF%E4%BB%98)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`STRIPE_SECRET_KEY` | 支付 | API 认证 |   
`STRIPE_WEBHOOK_SECRET` | Webhooks | Webhook 验证 | Stripe Webhooks 设置  
`NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY` | 订阅 | 产品价格 ID | Stripe Products  
`NEXT_PUBLIC_PRICE_ID_PRO_YEARLY` | 订阅 | 产品价格 ID | Stripe Products  
`NEXT_PUBLIC_PRICE_ID_LIFETIME` | 一次性 | 产品价格 ID | Stripe Products  
`CREEM_API_KEY` | 替代支付 | API 认证 |   
`CREEM_WEBHOOK_SECRET` | 替代支付 | Webhook 验证 | Creem Dashboard  
### [存储](https://nextdevkit.com/zh/docs/environment-variables#%E5%AD%98%E5%82%A8)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`NEXT_PUBLIC_AVATARS_BUCKET_NAME` | 文件上传 | 存储桶标识符 | 你的存储提供商  
`STORAGE_REGION` | 文件上传 | 存储区域 | R2: `auto`, S3: `us-east-1`  
`STORAGE_ACCESS_KEY_ID` | 文件上传 | API 认证 | R2/S3 API Keys  
`STORAGE_SECRET_ACCESS_KEY` | 文件上传 | API 密钥 | R2/S3 API Keys  
`STORAGE_ENDPOINT` | 仅 R2 | R2 端点 URL | Cloudflare R2 Dashboard  
`STORAGE_ACCOUNT_ID` | R2 Workers | 账户标识符 | Cloudflare Dashboard  
### [数据分析](https://nextdevkit.com/zh/docs/environment-variables#%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | 可选 | GA4 跟踪 |   
`NEXT_PUBLIC_UMAMI_WEBSITE_ID` | 可选 | Umami 跟踪 | Umami Dashboard  
`NEXT_PUBLIC_UMAMI_SCRIPT_URL` | 可选 | Umami 脚本 | Umami 实例 URL  
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | 可选 | Plausible 跟踪 | 你的域名  
`NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL` | 可选 | Plausible 脚本 | `https://plausible.io/js/script.js`  
### [AI 和积分](https://nextdevkit.com/zh/docs/environment-variables#ai-%E5%92%8C%E7%A7%AF%E5%88%86)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`GOOGLE_GENERATIVE_AI_API_KEY` | AI 功能 | API 认证 |   
`CREDIT_LITE_PRICE_ID` | 积分系统 | 产品价格 ID | Stripe Products  
`CREDIT_STANDARD_PRICE_ID` | 积分系统 | 产品价格 ID | Stripe Products  
`CREDIT_PRO_PRICE_ID` | 积分系统 | 产品价格 ID | Stripe Products  
`CREDIT_MAX_PRICE_ID` | 积分系统 | 产品价格 ID | Stripe Products  
### [安全](https://nextdevkit.com/zh/docs/environment-variables#%E5%AE%89%E5%85%A8)
变量 | 必需 | 用途 | 获取位置  
---|---|---|---  
`CRON_SECRET` | 定时任务 | 端点保护 | `openssl rand -base64 16`  
`AWS_ACCESS_KEY_ID` | AWS 部署 | AWS 认证 | AWS IAM  
`AWS_SECRET_ACCESS_KEY` | AWS 部署 | AWS 密钥 | AWS IAM  
* * *
## [故障排除](https://nextdevkit.com/zh/docs/environment-variables#%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/environment-variables#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
**❌ "Missing BETTER_AUTH_SECRET"**
```
# 生成新密钥
openssl rand -base64 32
# 添加到 .env.local
```

**❌ "Database connection failed"**
  * 检查 `DATABASE_URL` 格式
  * 验证数据库正在运行
  * 检查网络连接
  * 确保云数据库使用 `sslmode=require`


**❌ "Stripe webhook signature verification failed"**
  * 开发环境:使用 `stripe listen` webhook 密钥
  * 生产环境:使用 Stripe Dashboard webhook 密钥
  * 确保 `STRIPE_WEBHOOK_SECRET` 匹配你的环境


**❌ "OAuth callback URL mismatch"**
  * 验证 `BETTER_AUTH_URL` 匹配 OAuth 应用设置
  * 检查回调 URL:`{BETTER_AUTH_URL}/api/auth/callback/{provider}`
  * 为开发/预发布/生产环境使用不同的 OAuth 应用


**❌ "Storage upload failed"**
  * 验证存储桶名称和权限
  * 检查 `STORAGE_ACCESS_KEY_ID` 和密钥
  * 对于 R2:确保 `STORAGE_ENDPOINT` 正确
  * 对于 S3:验证区域


### [环境特定调试](https://nextdevkit.com/zh/docs/environment-variables#%E7%8E%AF%E5%A2%83%E7%89%B9%E5%AE%9A%E8%B0%83%E8%AF%95)
**检查加载的变量:**
```
// 临时添加到任何服务器组件
console.log('Loaded env:', {
  hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  // 永远不要记录实际值!
});
```

**在浏览器中验证公共变量:**
```
// 浏览器控制台
console.log('Public URL:', process.env.NEXT_PUBLIC_APP_URL);
```

* * *
## [最佳实践](https://nextdevkit.com/zh/docs/environment-variables#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)
### [开发工作流](https://nextdevkit.com/zh/docs/environment-variables#%E5%BC%80%E5%8F%91%E5%B7%A5%E4%BD%9C%E6%B5%81)
  1. **使用`.env.local` 进行本地开发**
     * 默认被 Git 忽略
     * 覆盖其他 `.env` 文件
  2. **保持`.env.example` 更新**
     * 使用虚拟值
     * 记录所有必需的变量
     * 提交到仓库
  3. **分离环境**
```
.env.local          → 开发环境
.env.production     → 生产环境值
```



### [安全检查清单](https://nextdevkit.com/zh/docs/environment-variables#%E5%AE%89%E5%85%A8%E6%A3%80%E6%9F%A5%E6%B8%85%E5%8D%95)
  * 所有密钥使用强随机值
  * 无密钥提交到 Git
  * 每个环境使用不同的 OAuth 应用
  * Webhook 密钥匹配环境
  * API 密钥具有最小必需权限
  * 生产环境使用 SSL/TLS (`https://`)
  * 每 90 天轮换密钥


### [生产环境部署](https://nextdevkit.com/zh/docs/environment-variables#%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E9%83%A8%E7%BD%B2)
  1. **验证所有必需变量已设置**
  2. **使用生产 API 密钥(而非测试密钥)**
  3. **更新 OAuth 回调 URL**
  4. **配置生产 webhook 端点**
  5. **将`BETTER_AUTH_URL` 设置为生产域名**
  6. **为数据库连接启用 SSL**


* * *
## [迁移指南](https://nextdevkit.com/zh/docs/environment-variables#%E8%BF%81%E7%A7%BB%E6%8C%87%E5%8D%97)
### [从开发环境迁移到生产环境](https://nextdevkit.com/zh/docs/environment-variables#%E4%BB%8E%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83%E8%BF%81%E7%A7%BB%E5%88%B0%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83)
#### [更新认证 URL](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%B4%E6%96%B0%E8%AE%A4%E8%AF%81-url)
```
# 开发环境
BETTER_AUTH_URL=http://localhost:3000
# 生产环境
BETTER_AUTH_URL=https://yourdomain.com
```

#### [切换到生产密钥](https://nextdevkit.com/zh/docs/environment-variables#%E5%88%87%E6%8D%A2%E5%88%B0%E7%94%9F%E4%BA%A7%E5%AF%86%E9%92%A5)
  * Stripe:`sk_live_...` 而不是 `sk_test_...`
  * OAuth 应用:创建生产应用
  * 数据库:使用生产实例
  * 邮件:移除测试模式


#### [更新 OAuth 回调](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%B4%E6%96%B0-oauth-%E5%9B%9E%E8%B0%83)
注册生产回调 URL:
```
https://yourdomain.com/api/auth/callback/github
https://yourdomain.com/api/auth/callback/google
```

#### [配置生产 Webhooks](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE%E7%94%9F%E4%BA%A7-webhooks)
  * Stripe:`https://yourdomain.com/api/webhooks/stripe`
  * 使用生产 webhook 密钥


* * *
## [下一步](https://nextdevkit.com/zh/docs/environment-variables#%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在你已经了解了环境变量:
  1. **配置部署平台:** [部署指南](https://nextdevkit.com/docs/deployment)
  2. **设置数据库:** [数据库设置](https://nextdevkit.com/docs/database)
  3. **配置认证:** [认证指南](https://nextdevkit.com/docs/authentication)
  4. **启用支付:** [支付集成](https://nextdevkit.com/docs/payment)


**有问题?** 查看我们的[文档](https://nextdevkit.com/docs)或[联系支持](https://nextdevkit.com/contact)
[分析统计 学习如何在 NEXTDEVKIT 中通过 Cookie 同意实现分析跟踪](https://nextdevkit.com/zh/docs/analytics)[概述 为您的 NEXTDEVKIT 应用程序选择合适的部署平台](https://nextdevkit.com/zh/docs/deployment)
[](https://nextdevkit.com/zh/docs/environment-variables#%E7%90%86%E8%A7%A3%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%AE%89%E5%85%A8%E5%8E%9F%E5%88%99)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%96%87%E4%BB%B6%E7%BB%84%E7%BB%87)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%B8%90%E8%BF%9B%E5%BC%8F%E9%85%8D%E7%BD%AE%E4%B9%8B%E6%97%85)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-1-%E7%BA%A7%E6%9C%80%E5%B0%8F%E8%AE%BE%E7%BD%AE5-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%94%9F%E6%88%90%E8%AE%A4%E8%AF%81%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5)[](https://nextdevkit.com/zh/docs/environment-variables#%E8%BF%90%E8%A1%8C%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-2-%E7%BA%A7%E9%82%AE%E4%BB%B6%E9%9B%86%E6%88%9010-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E6%8B%A9%E9%82%AE%E4%BB%B6%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/environment-variables#%E8%8E%B7%E5%8F%96-resend-api-%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%B7%BB%E5%8A%A0%E9%82%AE%E4%BB%B6%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-3-%E7%BA%A7%E7%A4%BE%E4%BA%A4%E7%99%BB%E5%BD%9515-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-github-oauth)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-google-oauth)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-4-%E7%BA%A7%E6%94%AF%E4%BB%98%E9%9B%86%E6%88%9020-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E6%8B%A9%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-stripe)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-webhooks)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%BF%E4%BB%A3%E6%96%B9%E6%A1%88%E9%85%8D%E7%BD%AE-creem)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-5-%E7%BA%A7%E6%96%87%E4%BB%B6%E5%AD%98%E5%82%A815-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E6%8B%A9%E5%AD%98%E5%82%A8%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE-cloudflare-r2)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%BF%E4%BB%A3%E6%96%B9%E6%A1%88%E9%85%8D%E7%BD%AE-aws-s3)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-6-%E7%BA%A7%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%9010-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E9%A1%B9-1-google-analytics)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E9%A1%B9-2-umami-analytics)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%80%89%E9%A1%B9-3-plausible-analytics)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-7-%E7%BA%A7ai-%E9%9B%86%E6%88%905-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E8%8E%B7%E5%8F%96-google-ai-api-%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-8-%E7%BA%A7%E7%A7%AF%E5%88%86%E7%B3%BB%E7%BB%9F10-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%9C%A8-stripe-%E4%B8%AD%E5%88%9B%E5%BB%BA%E7%A7%AF%E5%88%86%E4%BA%A7%E5%93%81)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%B7%BB%E5%8A%A0%E7%A7%AF%E5%88%86%E4%BB%B7%E6%A0%BC-id)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%AC%AC-9-%E7%BA%A7%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A15-%E5%88%86%E9%92%9F)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%94%9F%E6%88%90%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%B9%B3%E5%8F%B0%E7%89%B9%E5%AE%9A%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/environment-variables#nextjs--vercel-%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/environment-variables#cloudflare-workers-%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/environment-variables#aws-sst-%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%BF%AB%E9%80%9F%E5%8F%82%E8%80%83)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%BF%85%E9%9C%80%E5%8F%98%E9%87%8F%E6%9C%80%E5%B0%8F%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/environment-variables#%E8%AE%A4%E8%AF%81)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%82%AE%E4%BB%B6)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%94%AF%E4%BB%98)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%AD%98%E5%82%A8)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90)[](https://nextdevkit.com/zh/docs/environment-variables#ai-%E5%92%8C%E7%A7%AF%E5%88%86)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%AE%89%E5%85%A8)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%8E%AF%E5%A2%83%E7%89%B9%E5%AE%9A%E8%B0%83%E8%AF%95)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%BC%80%E5%8F%91%E5%B7%A5%E4%BD%9C%E6%B5%81)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%AE%89%E5%85%A8%E6%A3%80%E6%9F%A5%E6%B8%85%E5%8D%95)[](https://nextdevkit.com/zh/docs/environment-variables#%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/environment-variables#%E8%BF%81%E7%A7%BB%E6%8C%87%E5%8D%97)[](https://nextdevkit.com/zh/docs/environment-variables#%E4%BB%8E%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83%E8%BF%81%E7%A7%BB%E5%88%B0%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%B4%E6%96%B0%E8%AE%A4%E8%AF%81-url)[](https://nextdevkit.com/zh/docs/environment-variables#%E5%88%87%E6%8D%A2%E5%88%B0%E7%94%9F%E4%BA%A7%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/environment-variables#%E6%9B%B4%E6%96%B0-oauth-%E5%9B%9E%E8%B0%83)[](https://nextdevkit.com/zh/docs/environment-variables#%E9%85%8D%E7%BD%AE%E7%94%9F%E4%BA%A7-webhooks)[](https://nextdevkit.com/zh/docs/environment-variables#%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
