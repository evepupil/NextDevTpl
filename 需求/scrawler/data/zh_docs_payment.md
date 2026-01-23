# 来源: https://nextdevkit.com/zh/docs/payment

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
支付概述🚀 支付系统
配置支付模块
# 支付概述
学习如何在 NEXTDEVKIT 中使用 Stripe 或 Creem 设置和使用支付
## [🚀 支付系统](https://nextdevkit.com/zh/docs/payment#-%E6%94%AF%E4%BB%98%E7%B3%BB%E7%BB%9F)
NEXTDEVKIT 支持两个支付提供商来处理支付和订阅：
  * **[Stripe](https://nextdevkit.com/docs/payment/stripe)** - 最受欢迎的支付处理平台
  * **[Creem](https://nextdevkit.com/docs/payment/creem)** - 以开发者为中心的支付平台，拥有简单的 API


两个提供商都支持：
  * ✅ **订阅支付** （月付/年付）
  * ✅ **一次性支付** （终身计划）
  * ✅ **免费计划**
  * ✅ **试用期**
  * ✅ **Webhooks**
  * ✅ **客户门户**


## [💳 支持的支付类型](https://nextdevkit.com/zh/docs/payment#-%E6%94%AF%E6%8C%81%E7%9A%84%E6%94%AF%E4%BB%98%E7%B1%BB%E5%9E%8B)
NEXTDEVKIT 支持以下计划类型的灵活定价：
### [🆓 免费计划](https://nextdevkit.com/zh/docs/payment#-%E5%85%8D%E8%B4%B9%E8%AE%A1%E5%88%92)
  * 无需支付
  * 适合免费增值模式
  * 功能访问受限


### [💎 专业版订阅](https://nextdevkit.com/zh/docs/payment#-%E4%B8%93%E4%B8%9A%E7%89%88%E8%AE%A2%E9%98%85)
  * 月付或年付
  * 可选试用期
  * 重复支付


### [🏆 终身计划](https://nextdevkit.com/zh/docs/payment#-%E7%BB%88%E8%BA%AB%E8%AE%A1%E5%88%92)
  * 一次性支付
  * 永久访问
  * 无重复费用


### [🏢 企业计划](https://nextdevkit.com/zh/docs/payment#-%E4%BC%81%E4%B8%9A%E8%AE%A1%E5%88%92)
  * 基于联系的定价
  * 自定义功能
  * 直接销售流程


## [🏗️ 支付架构](https://nextdevkit.com/zh/docs/payment#%EF%B8%8F-%E6%94%AF%E4%BB%98%E6%9E%B6%E6%9E%84)
支付系统使用提供商模式构建，以获得灵活性：
```
src/
├── payment/
│   ├── types.ts          # 支付类型和接口
│   ├── actions.ts        # 支付服务器操作
│   └── providers/
│       ├── index.ts      # 支付提供商工厂
│       ├── stripe.ts     # Stripe 实现
│       └── creem.ts      # Creem 实现
├── config/
│   └── marketing/
│       └── pricing.ts    # 定价配置
```

## [🎯 选择您的提供商](https://nextdevkit.com/zh/docs/payment#-%E9%80%89%E6%8B%A9%E6%82%A8%E7%9A%84%E6%8F%90%E4%BE%9B%E5%95%86)
选择最适合您需求的支付提供商：
### [何时使用 Stripe](https://nextdevkit.com/zh/docs/payment#%E4%BD%95%E6%97%B6%E4%BD%BF%E7%94%A8-stripe)
  * **全球覆盖** ：接受来自 195+ 个国家的支付
  * **成熟生态系统** ：广泛的文档和社区
  * **企业功能** ：高级欺诈检测和报告
  * **复杂定价** ：多币种和税收处理


### [何时使用 Creem](https://nextdevkit.com/zh/docs/payment#%E4%BD%95%E6%97%B6%E4%BD%BF%E7%94%A8-creem)
  * **开发者体验** ：简单直接的 API
  * **现代界面** ：干净直观的仪表板


## [📋 入门指南](https://nextdevkit.com/zh/docs/payment#-%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97)
  1. **选择您的提供商** ：[Stripe](https://nextdevkit.com/docs/payment/stripe) 或 [Creem](https://nextdevkit.com/docs/payment/creem)
  2. **设置您选择的提供商账户**
  3. **为您的提供商配置环境变量**
  4. **在提供商仪表板中创建产品和定价**
  5. **使用您的定价信息配置 NEXTDEVKIT**
  6. **使用测试卡和 webhooks 测试支付**


## [🔧 配置](https://nextdevkit.com/zh/docs/payment#-%E9%85%8D%E7%BD%AE)
支付提供商在 `src/config/index.ts` 中配置：
```
payment: {
  provider: "stripe", // 或 "creem"
  currency: "USD",
  yearlyDiscount: 20,
  redirectAfterCheckout: "/app/dashboard",
  // ... 您定价配置的其余部分
}
```

要切换提供商，只需更改 `provider` 值并更新您的环境变量。
## [🧪 测试](https://nextdevkit.com/zh/docs/payment#-%E6%B5%8B%E8%AF%95)
两个提供商都提供全面的测试环境：
  * **测试 API 密钥** 用于开发
  * **测试信用卡** 用于支付模拟
  * **Webhook 测试** 工具
  * **本地开发** 支持


## [🔗 下一步](https://nextdevkit.com/zh/docs/payment#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
选择您的支付提供商以继续：
  * 📘 [设置 Stripe](https://nextdevkit.com/docs/payment/stripe) - 完整的 Stripe 集成指南
  * 📗 [设置 Creem](https://nextdevkit.com/docs/payment/creem) - 完整的 Creem 集成指南
  * ⚙️ [配置指南](https://nextdevkit.com/docs/payment/configuration) - 配置定价和计划
  * 🔧 [如何使用](https://nextdevkit.com/docs/payment/how-to-use) - 学习支付 API


* * *
## [📚 其他资源](https://nextdevkit.com/zh/docs/payment#-%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)
  * 🔐 [了解身份验证](https://nextdevkit.com/docs/authentication)
  * 🗄️ [探索数据库架构](https://nextdevkit.com/docs/database)
  * 🎨 [自定义用户界面](https://nextdevkit.com/docs/project-structure)


[国际化多语言支持 学习如何在 NEXTDEVKIT 中使用 next-intl 实现多语言支持](https://nextdevkit.com/zh/docs/i18n)[Stripe 集成 在 NEXTDEVKIT 中设置和配置 Stripe 支付的完整指南](https://nextdevkit.com/zh/docs/payment/stripe)
[](https://nextdevkit.com/zh/docs/payment#-%E6%94%AF%E4%BB%98%E7%B3%BB%E7%BB%9F)[](https://nextdevkit.com/zh/docs/payment#-%E6%94%AF%E6%8C%81%E7%9A%84%E6%94%AF%E4%BB%98%E7%B1%BB%E5%9E%8B)[](https://nextdevkit.com/zh/docs/payment#-%E5%85%8D%E8%B4%B9%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/payment#-%E4%B8%93%E4%B8%9A%E7%89%88%E8%AE%A2%E9%98%85)[](https://nextdevkit.com/zh/docs/payment#-%E7%BB%88%E8%BA%AB%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/payment#-%E4%BC%81%E4%B8%9A%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/payment#%EF%B8%8F-%E6%94%AF%E4%BB%98%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/payment#-%E9%80%89%E6%8B%A9%E6%82%A8%E7%9A%84%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/payment#%E4%BD%95%E6%97%B6%E4%BD%BF%E7%94%A8-stripe)[](https://nextdevkit.com/zh/docs/payment#%E4%BD%95%E6%97%B6%E4%BD%BF%E7%94%A8-creem)[](https://nextdevkit.com/zh/docs/payment#-%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97)[](https://nextdevkit.com/zh/docs/payment#-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment#-%E6%B5%8B%E8%AF%95)[](https://nextdevkit.com/zh/docs/payment#-%E4%B8%8B%E4%B8%80%E6%AD%A5)[](https://nextdevkit.com/zh/docs/payment#-%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
