# 来源: https://nextdevkit.com/zh/docs/payment/stripe

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
Stripe 集成🚀 Stripe 设置
配置支付模块
# Stripe 集成
在 NEXTDEVKIT 中设置和配置 Stripe 支付的完整指南
## [🚀 Stripe 设置](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E8%AE%BE%E7%BD%AE)
按照以下步骤将 Stripe 与 NEXTDEVKIT 集成：
### [1. **创建 Stripe 账户**](https://nextdevkit.com/zh/docs/payment/stripe#1-%E5%88%9B%E5%BB%BA-stripe-%E8%B4%A6%E6%88%B7)
  1. 在 
  2. 转到 


### [2. **获取 API 密钥**](https://nextdevkit.com/zh/docs/payment/stripe#2-%E8%8E%B7%E5%8F%96-api-%E5%AF%86%E9%92%A5)
  1. 转到 **开发者** → **API 密钥**
  2. 复制您的 **密钥** （测试模式以 `sk_test_` 开头）


添加到您的 `.env` 文件：
```
STRIPE_SECRET_KEY="sk_test_your_secret_key"
```

### [3. **设置 Webhooks**](https://nextdevkit.com/zh/docs/payment/stripe#3-%E8%AE%BE%E7%BD%AE-webhooks)
  1. 转到 **开发者** → **Webhooks**
  2. 点击 **"添加端点"**
  3. 输入您的 webhook URL：`https://your-domain.com/api/webhooks/stripe`
  4. 选择这些事件：
     * `checkout.session.completed`
     * `customer.subscription.created`
     * `customer.subscription.updated`
     * `customer.subscription.deleted`
  5. 复制 **Webhook 签名密钥** （以 `whsec_` 开头）


添加到您的 `.env` 文件：
```
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### [4. **创建产品和价格**](https://nextdevkit.com/zh/docs/payment/stripe#4-%E5%88%9B%E5%BB%BA%E4%BA%A7%E5%93%81%E5%92%8C%E4%BB%B7%E6%A0%BC)
#### [专业版订阅产品](https://nextdevkit.com/zh/docs/payment/stripe#%E4%B8%93%E4%B8%9A%E7%89%88%E8%AE%A2%E9%98%85%E4%BA%A7%E5%93%81)
  1. 转到 **产品** → **添加产品**
  2. **名称** ："专业版计划"
  3. 添加 **月付价格** ：
     * **价格** ：您的月付价格
     * **计费周期** ：月付
     * **重复** ：是
     * 复制 **价格 ID** （以 `price_` 开头）
  4. 添加 **年付价格** ：
     * **价格** ：您的年付价格
     * **计费周期** ：年付
     * **重复** ：是
     * 复制 **价格 ID** （以 `price_` 开头）


#### [终身产品](https://nextdevkit.com/zh/docs/payment/stripe#%E7%BB%88%E8%BA%AB%E4%BA%A7%E5%93%81)
  1. 转到 **产品** → **添加产品**
  2. **名称** ："终身计划"
  3. 添加 **一次性价格** ：
     * **价格** ：您的终身价格
     * **计费周期** ：一次性
     * **重复** ：否
     * 复制 **价格 ID** （以 `price_` 开头）


### [5. **配置环境变量**](https://nextdevkit.com/zh/docs/payment/stripe#5-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
```
# Stripe 配置
STRIPE_SECRET_KEY="sk_test_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
# 价格 ID
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="price_your_monthly_price_id"
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="price_your_yearly_price_id"
NEXT_PUBLIC_PRICE_ID_LIFETIME="price_your_lifetime_price_id"
```

### [6. **更新支付提供商配置**](https://nextdevkit.com/zh/docs/payment/stripe#6-%E6%9B%B4%E6%96%B0%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E9%85%8D%E7%BD%AE)
在 `src/config/index.ts` 中，将提供商设置为 Stripe：
```
payment: {
  provider: "stripe",
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

## [🧪 使用 Stripe 测试](https://nextdevkit.com/zh/docs/payment/stripe#-%E4%BD%BF%E7%94%A8-stripe-%E6%B5%8B%E8%AF%95)
### [测试信用卡](https://nextdevkit.com/zh/docs/payment/stripe#%E6%B5%8B%E8%AF%95%E4%BF%A1%E7%94%A8%E5%8D%A1)
使用这些测试卡与 Stripe：
卡号 | 描述  
---|---  
`4242 4242 4242 4242` | 成功支付  
`4000 0000 0000 3220` | 3D 安全认证  
`4000 0000 0000 9995` | 余额不足  
`4000 0000 0000 0069` | 卡已过期  
### [本地开发](https://nextdevkit.com/zh/docs/payment/stripe#%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91)
```
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe
# 登录 Stripe
stripe login
# 转发事件到本地服务器
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# 测试 webhooks
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### [使用 ngrok 进行 Webhook 测试](https://nextdevkit.com/zh/docs/payment/stripe#%E4%BD%BF%E7%94%A8-ngrok-%E8%BF%9B%E8%A1%8C-webhook-%E6%B5%8B%E8%AF%95)
您也可以使用 
```
ngrok http 3000
```

然后在您的 Stripe webhook 配置中使用 ngrok URL。
## [🔧 Stripe 功能](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E5%8A%9F%E8%83%BD)
### [客户门户](https://nextdevkit.com/zh/docs/payment/stripe#%E5%AE%A2%E6%88%B7%E9%97%A8%E6%88%B7)
Stripe 提供托管客户门户，客户可以：
  * 更新支付方式
  * 查看账单历史
  * 取消订阅
  * 下载发票


### [高级功能](https://nextdevkit.com/zh/docs/payment/stripe#%E9%AB%98%E7%BA%A7%E5%8A%9F%E8%83%BD)
  * **税收计算** ：为全球客户自动计税
  * **欺诈检测** ：内置欺诈预防
  * **订阅管理** ：灵活的订阅处理
  * **多币种** ：支持 135+ 种货币
  * **支付方式** ：信用卡、数字钱包、银行转账


## [🔧 故障排除](https://nextdevkit.com/zh/docs/payment/stripe#-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/payment/stripe#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
**Webhook 未接收事件** ：
  * 检查 webhook URL 是否正确
  * 验证 webhook 签名密钥
  * 确保生产环境使用 HTTPS
  * 检查选择的事件


**支付失败** ：
  * 验证 API 密钥是否正确
  * 检查卡片详细信息格式
  * 确保适当的错误处理
  * 使用不同的卡进行测试


**客户门户问题** ：
  * 检查客户 ID 是否有效
  * 验证返回 URL 是否正确
  * 确保客户有支付方式


**订阅问题** ：
  * 检查订阅状态
  * 验证 webhook 处理
  * 查看计费周期设置


## [📊 Stripe 仪表板](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E4%BB%AA%E8%A1%A8%E6%9D%BF)
Stripe 仪表板提供：
  * **实时分析** ：收入、客户指标
  * **支付跟踪** ：交易历史和状态
  * **客户管理** ：客户资料和数据
  * **订阅监控** ：活跃订阅和流失
  * **税务报告** ：自动税收计算


## [🔗 Stripe 资源](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E8%B5%84%E6%BA%90)
* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/payment/stripe#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在 Stripe 已配置：
  * ⚙️ [配置您的定价计划](https://nextdevkit.com/docs/payment/configuration)
  * 🔧 [学习如何使用支付 API](https://nextdevkit.com/docs/payment/how-to-use)
  * 🔐 [设置身份验证](https://nextdevkit.com/docs/authentication)
  * 🗄️ [配置数据库](https://nextdevkit.com/docs/database)


[支付概述 学习如何在 NEXTDEVKIT 中使用 Stripe 或 Creem 设置和使用支付](https://nextdevkit.com/zh/docs/payment)[Creem 集成 在 NEXTDEVKIT 中设置和配置 Creem 支付的完整指南](https://nextdevkit.com/zh/docs/payment/creem)
[](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E8%AE%BE%E7%BD%AE)[**创建 Stripe 账户**](https://nextdevkit.com/zh/docs/payment/stripe#1-%E5%88%9B%E5%BB%BA-stripe-%E8%B4%A6%E6%88%B7)[**获取 API 密钥**](https://nextdevkit.com/zh/docs/payment/stripe#2-%E8%8E%B7%E5%8F%96-api-%E5%AF%86%E9%92%A5)[**设置 Webhooks**](https://nextdevkit.com/zh/docs/payment/stripe#3-%E8%AE%BE%E7%BD%AE-webhooks)[**创建产品和价格**](https://nextdevkit.com/zh/docs/payment/stripe#4-%E5%88%9B%E5%BB%BA%E4%BA%A7%E5%93%81%E5%92%8C%E4%BB%B7%E6%A0%BC)[](https://nextdevkit.com/zh/docs/payment/stripe#%E4%B8%93%E4%B8%9A%E7%89%88%E8%AE%A2%E9%98%85%E4%BA%A7%E5%93%81)[](https://nextdevkit.com/zh/docs/payment/stripe#%E7%BB%88%E8%BA%AB%E4%BA%A7%E5%93%81)[**配置环境变量**](https://nextdevkit.com/zh/docs/payment/stripe#5-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[**更新支付提供商配置**](https://nextdevkit.com/zh/docs/payment/stripe#6-%E6%9B%B4%E6%96%B0%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment/stripe#-%E4%BD%BF%E7%94%A8-stripe-%E6%B5%8B%E8%AF%95)[](https://nextdevkit.com/zh/docs/payment/stripe#%E6%B5%8B%E8%AF%95%E4%BF%A1%E7%94%A8%E5%8D%A1)[](https://nextdevkit.com/zh/docs/payment/stripe#%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91)[](https://nextdevkit.com/zh/docs/payment/stripe#%E4%BD%BF%E7%94%A8-ngrok-%E8%BF%9B%E8%A1%8C-webhook-%E6%B5%8B%E8%AF%95)[](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/payment/stripe#%E5%AE%A2%E6%88%B7%E9%97%A8%E6%88%B7)[](https://nextdevkit.com/zh/docs/payment/stripe#%E9%AB%98%E7%BA%A7%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/payment/stripe#-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/payment/stripe#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E4%BB%AA%E8%A1%A8%E6%9D%BF)[](https://nextdevkit.com/zh/docs/payment/stripe#-stripe-%E8%B5%84%E6%BA%90)[](https://nextdevkit.com/zh/docs/payment/stripe#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
