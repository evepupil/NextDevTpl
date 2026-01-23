# 来源: https://nextdevkit.com/zh/docs/payment/creem

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)
[](https://nextdevkit.com/zh/docs/payment)[](https://nextdevkit.com/zh/docs/payment/stripe)[](https://nextdevkit.com/zh/docs/payment/creem)[](https://nextdevkit.com/zh/docs/payment/configuration)[](https://nextdevkit.com/zh/docs/payment/how-to-use)
[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
Creem 集成🚀 Creem 设置
配置支付模块
# Creem 集成
在 NEXTDEVKIT 中设置和配置 Creem 支付的完整指南
## [🚀 Creem 设置](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E8%AE%BE%E7%BD%AE)
Creem 是一个以开发者为中心的支付平台，为处理支付和订阅提供简单直接的 API。
### [1. **创建 Creem 账户**](https://nextdevkit.com/zh/docs/payment/creem#1-%E5%88%9B%E5%BB%BA-creem-%E8%B4%A6%E6%88%B7)
  1. 在 


### [2. **获取 API 密钥**](https://nextdevkit.com/zh/docs/payment/creem#2-%E8%8E%B7%E5%8F%96-api-%E5%AF%86%E9%92%A5)
  1. 转到 **开发者** → **API 密钥**
  2. 复制您的 **API 密钥** （测试模式以 `ck_test_` 开头）
  3. 使用以下 URL 创建新的 webhook：`https://your-domain.com/api/webhooks/creem`
  4. 复制您的 **Webhook 密钥** 用于 webhook 验证


添加到您的 `.env` 文件：
```
CREEM_API_KEY="ck_test_your_api_key"
CREEM_WEBHOOK_SECRET="your_webhook_secret"
```

### [3. **创建产品**](https://nextdevkit.com/zh/docs/payment/creem#3-%E5%88%9B%E5%BB%BA%E4%BA%A7%E5%93%81)
#### [专业版订阅产品](https://nextdevkit.com/zh/docs/payment/creem#%E4%B8%93%E4%B8%9A%E7%89%88%E8%AE%A2%E9%98%85%E4%BA%A7%E5%93%81)
  1. 转到 **产品** → **添加产品**
  2. **名称** ："专业版计划"
  3. **类型** ："订阅"
  4. 添加 **月付产品** ：
     * **价格** ：您的月付价格
     * **计费间隔** ：月付
     * 复制 **产品 ID**
  5. 添加 **年付产品** ：
     * **价格** ：您的年付价格
     * **计费间隔** ：年付
     * 复制 **产品 ID**


#### [终身产品](https://nextdevkit.com/zh/docs/payment/creem#%E7%BB%88%E8%BA%AB%E4%BA%A7%E5%93%81)
  1. 转到 **产品** → **添加产品**
  2. **名称** ："终身计划"
  3. **类型** ："单次支付"
  4. **价格** ：您的终身价格
  5. 复制 **产品 ID**


### [5. **配置环境变量**](https://nextdevkit.com/zh/docs/payment/creem#5-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
```
# Creem 配置
CREEM_API_KEY="ck_test_your_api_key"
CREEM_WEBHOOK_SECRET="your_webhook_secret"
# 产品 ID（在 Creem 中，这些是产品 ID，不是价格 ID）
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="prod_your_monthly_product_id"
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="prod_your_yearly_product_id"
NEXT_PUBLIC_PRICE_ID_LIFETIME="prod_your_lifetime_product_id"
```

### [6. **更新支付提供商配置**](https://nextdevkit.com/zh/docs/payment/creem#6-%E6%9B%B4%E6%96%B0%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E9%85%8D%E7%BD%AE)
在 `src/config/index.ts` 中，将提供商设置为 Creem：
```
payment: {
  provider: "creem",
  currency: "USD",
  // ... 配置的其余部分
  plans: {
    pro: {
      prices: [
					{
						amount: 9.99, // 您的月付价格
						interval: PlanInterval.MONTH,
						trialPeriodDays: 7, // 您的试用期天数
					},
					{
						amount: 99, // 您的年付价格
						interval: PlanInterval.YEAR,
						trialPeriodDays: 30, // 您的试用期天数
					},
      ],
    },
  },
}
```

## [🧪 使用 Creem 测试](https://nextdevkit.com/zh/docs/payment/creem#-%E4%BD%BF%E7%94%A8-creem-%E6%B5%8B%E8%AF%95)
### [测试模式](https://nextdevkit.com/zh/docs/payment/creem#%E6%B5%8B%E8%AF%95%E6%A8%A1%E5%BC%8F)
当在仪表板中切换测试模式时，Creem 会自动提供测试环境：
  * 所有交易都是模拟的
  * 不处理真实资金
  * 完整的 webhook 功能可用


### [测试信用卡](https://nextdevkit.com/zh/docs/payment/creem#%E6%B5%8B%E8%AF%95%E4%BF%A1%E7%94%A8%E5%8D%A1)
使用这些测试卡与 Creem：
卡号 | 描述  
---|---  
`4242 4242 4242 4242` | 成功支付  
### [本地开发](https://nextdevkit.com/zh/docs/payment/creem#%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91)
对于本地 webhook 测试，您可以使用 
```
# 安装 ngrok
npm install -g ngrok
# 创建到本地服务器的隧道
ngrok http 3000
# 在您的 Creem webhook 配置中使用 ngrok URL
# 示例：https://abc123.ngrok.io/api/webhooks/creem
```

## [🔧 Creem 功能](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E5%8A%9F%E8%83%BD)
### [简单的 API 设计](https://nextdevkit.com/zh/docs/payment/creem#%E7%AE%80%E5%8D%95%E7%9A%84-api-%E8%AE%BE%E8%AE%A1)
Creem 专注于开发者体验：
  * **干净的 REST API** ：直观的端点结构
  * **全面的文档** ：带示例的清晰文档
  * **快速设置** ：几分钟内启动，而不是几小时
  * **Webhook 可靠性** ：内置重试机制


### [客户门户](https://nextdevkit.com/zh/docs/payment/creem#%E5%AE%A2%E6%88%B7%E9%97%A8%E6%88%B7)
Creem 提供客户门户，客户可以：
  * 查看购买历史
  * 管理订阅
  * 更新支付方式
  * 下载收据


### [主要优势](https://nextdevkit.com/zh/docs/payment/creem#%E4%B8%BB%E8%A6%81%E4%BC%98%E5%8A%BF)
  * **更低的费用** ：有竞争力的交易费率
  * **全球覆盖** ：接受全球支付
  * **现代界面** ：干净、直观的仪表板
  * **开发者优先** ：由开发者构建，为开发者服务


## [🔄 Webhook 事件](https://nextdevkit.com/zh/docs/payment/creem#-webhook-%E4%BA%8B%E4%BB%B6)
Creem 向您的应用程序发送这些 webhook 事件：
### [结账事件](https://nextdevkit.com/zh/docs/payment/creem#%E7%BB%93%E8%B4%A6%E4%BA%8B%E4%BB%B6)
  * `checkout.completed`：一次性支付成功完成


### [订阅事件](https://nextdevkit.com/zh/docs/payment/creem#%E8%AE%A2%E9%98%85%E4%BA%8B%E4%BB%B6)
  * `subscription.active`：订阅处于活跃状态并正在计费
  * `subscription.trialing`：订阅处于试用期
  * `subscription.canceled`：订阅已取消
  * `subscription.expired`：由于支付失败，订阅已过期


## [📊 Creem 仪表板](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E4%BB%AA%E8%A1%A8%E6%9D%BF)
Creem 仪表板提供：
  * **交易概览** ：实时支付跟踪
  * **客户管理** ：客户资料和历史
  * **产品目录** ：管理您的产品和定价
  * **分析** ：收入和转化指标
  * **Webhook 监控** ：跟踪 webhook 交付状态


## [🔗 Creem 资源](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E8%B5%84%E6%BA%90)
* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/payment/creem#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在 Creem 已配置：
  * ⚙️ [配置您的定价计划](https://nextdevkit.com/docs/payment/configuration)
  * 🔧 [学习如何使用支付 API](https://nextdevkit.com/docs/payment/how-to-use)
  * 🔐 [设置身份验证](https://nextdevkit.com/docs/authentication)
  * 🗄️ [配置数据库](https://nextdevkit.com/docs/database)


[Stripe 集成 在 NEXTDEVKIT 中设置和配置 Stripe 支付的完整指南](https://nextdevkit.com/zh/docs/payment/stripe)[支付配置 学习如何在 NEXTDEVKIT 中为 Stripe 和 Creem 配置定价和支付计划](https://nextdevkit.com/zh/docs/payment/configuration)
[](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E8%AE%BE%E7%BD%AE)[**创建 Creem 账户**](https://nextdevkit.com/zh/docs/payment/creem#1-%E5%88%9B%E5%BB%BA-creem-%E8%B4%A6%E6%88%B7)[**获取 API 密钥**](https://nextdevkit.com/zh/docs/payment/creem#2-%E8%8E%B7%E5%8F%96-api-%E5%AF%86%E9%92%A5)[**创建产品**](https://nextdevkit.com/zh/docs/payment/creem#3-%E5%88%9B%E5%BB%BA%E4%BA%A7%E5%93%81)[](https://nextdevkit.com/zh/docs/payment/creem#%E4%B8%93%E4%B8%9A%E7%89%88%E8%AE%A2%E9%98%85%E4%BA%A7%E5%93%81)[](https://nextdevkit.com/zh/docs/payment/creem#%E7%BB%88%E8%BA%AB%E4%BA%A7%E5%93%81)[**配置环境变量**](https://nextdevkit.com/zh/docs/payment/creem#5-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[**更新支付提供商配置**](https://nextdevkit.com/zh/docs/payment/creem#6-%E6%9B%B4%E6%96%B0%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment/creem#-%E4%BD%BF%E7%94%A8-creem-%E6%B5%8B%E8%AF%95)[](https://nextdevkit.com/zh/docs/payment/creem#%E6%B5%8B%E8%AF%95%E6%A8%A1%E5%BC%8F)[](https://nextdevkit.com/zh/docs/payment/creem#%E6%B5%8B%E8%AF%95%E4%BF%A1%E7%94%A8%E5%8D%A1)[](https://nextdevkit.com/zh/docs/payment/creem#%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91)[](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/payment/creem#%E7%AE%80%E5%8D%95%E7%9A%84-api-%E8%AE%BE%E8%AE%A1)[](https://nextdevkit.com/zh/docs/payment/creem#%E5%AE%A2%E6%88%B7%E9%97%A8%E6%88%B7)[](https://nextdevkit.com/zh/docs/payment/creem#%E4%B8%BB%E8%A6%81%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/payment/creem#-webhook-%E4%BA%8B%E4%BB%B6)[](https://nextdevkit.com/zh/docs/payment/creem#%E7%BB%93%E8%B4%A6%E4%BA%8B%E4%BB%B6)[](https://nextdevkit.com/zh/docs/payment/creem#%E8%AE%A2%E9%98%85%E4%BA%8B%E4%BB%B6)[](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E4%BB%AA%E8%A1%A8%E6%9D%BF)[](https://nextdevkit.com/zh/docs/payment/creem#-creem-%E8%B5%84%E6%BA%90)[](https://nextdevkit.com/zh/docs/payment/creem#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
