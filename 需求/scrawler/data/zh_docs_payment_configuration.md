# 来源: https://nextdevkit.com/zh/docs/payment/configuration

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
支付配置💰 支付类型
配置支付模块
# 支付配置
学习如何在 NEXTDEVKIT 中为 Stripe 和 Creem 配置定价和支付计划
## [💰 支付类型](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%94%AF%E4%BB%98%E7%B1%BB%E5%9E%8B)
NEXTDEVKIT 支持两种支付类型，两个提供商都支持：
```
export enum PaymentType {
  SUBSCRIPTION = "subscription",
  ONE_TIME = "one-time",
}
export enum PlanInterval {
  MONTH = "monthly",
  YEAR = "yearly",
}
```

## [🎯 提供商配置](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%8F%90%E4%BE%9B%E5%95%86%E9%85%8D%E7%BD%AE)
首先，您需要在 `src/config/index.ts` 中设置支付提供商：
```
payment: {
  provider: "stripe", // 或 "creem"
  currency: "USD",
  yearlyDiscount: 20,
  redirectAfterCheckout: "/app/dashboard",
  plans: {
    // ... 您的计划配置
  }
}
```

### [在提供商之间切换](https://nextdevkit.com/zh/docs/payment/configuration#%E5%9C%A8%E6%8F%90%E4%BE%9B%E5%95%86%E4%B9%8B%E9%97%B4%E5%88%87%E6%8D%A2)
要从 Stripe 切换到 Creem 或反之：
  1. **更新提供商** ：


```
// 对于 Stripe
provider: "stripe"
// 对于 Creem  
provider: "creem"
```

  1. **更新环境变量** ：


```
# 对于 Stripe
STRIPE_SECRET_KEY="sk_test_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_secret"
# 对于 Creem
CREEM_API_KEY="ck_test_your_key"
CREEM_WEBHOOK_SECRET="your_webhook_secret"
```

  1. **更新价格/产品 ID** ：


```
# 相同的环境变量名对两个提供商都有效
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="your_monthly_id"
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="your_yearly_id"
NEXT_PUBLIC_PRICE_ID_LIFETIME="your_lifetime_id"
```

## [📋 定义计划和产品](https://nextdevkit.com/zh/docs/payment/configuration#-%E5%AE%9A%E4%B9%89%E8%AE%A1%E5%88%92%E5%92%8C%E4%BA%A7%E5%93%81)
您可以在 NEXTDEVKIT 项目的配置文件中管理计划和产品。您可以定义不同类型的计划：
### [🆓 免费计划](https://nextdevkit.com/zh/docs/payment/configuration#-%E5%85%8D%E8%B4%B9%E8%AE%A1%E5%88%92)
免费计划是未购买任何计划的用户的默认计划，或者可以用于访问产品的限制版本。
由于这不是付费计划，您不需要定义任何价格或为其附加产品 ID。
```
export const appConfig = {
  payment: {
    plans: {
      free: {
        id: "free",
        isFree: true,
      },
    }
  },
};
```

### [🏢 企业计划](https://nextdevkit.com/zh/docs/payment/configuration#-%E4%BC%81%E4%B8%9A%E8%AE%A1%E5%88%92)
企业计划不是真正的计划，但会在定价表中显示一个联系表单链接，客户可以联系您以获得产品访问权限。
由于这不是付费计划，您不需要定义任何价格或为其附加产品 ID。
```
export const appConfig = {
  payment: {
    plans: {
      enterprise: {
        id: "enterprise",
        isEnterprise: true,
        highlighted: true,
      },
    }
  },
};
```

### [🔄 订阅计划和 💎 一次性购买计划](https://nextdevkit.com/zh/docs/payment/configuration#-%E8%AE%A2%E9%98%85%E8%AE%A1%E5%88%92%E5%92%8C--%E4%B8%80%E6%AC%A1%E6%80%A7%E8%B4%AD%E4%B9%B0%E8%AE%A1%E5%88%92)
计划代表您应用程序的产品或服务，每个计划都是定价表中的一列。它具有以下属性：
  * **`popular`**：如果此计划应该突出显示为推荐 ⭐
  * **`highlighted`**：从定价表中突出显示计划 ✨
  * **`prices`**：为此计划定义价格 💰


一个计划可以有多个价格，例如月付和年付价格和/或您支持的每种货币。
价格具有以下属性：
  * **`type`**：价格类型，可以是`PaymentType.SUBSCRIPTION` 或 `PaymentType.ONE_TIME`
  * **`priceId`**：来自您的支付提供商的产品 ID 🆔
  * **`interval`**：价格间隔，可以是`PlanInterval.MONTH` 或 `PlanInterval.YEAR`
  * **`amount`**：价格金额 💵
  * **`trialPeriodDays`**：试用期天数，如果您不想提供试用期请省略 🎁


### [完整计划配置示例](https://nextdevkit.com/zh/docs/payment/configuration#%E5%AE%8C%E6%95%B4%E8%AE%A1%E5%88%92%E9%85%8D%E7%BD%AE%E7%A4%BA%E4%BE%8B)
```
payment: {
  provider: "stripe", // 或 "creem"
  currency: "USD",
  yearlyDiscount: 20,
  redirectAfterCheckout: "/app/dashboard",
  plans: {
    free: {
      id: "free",
      isFree: true,
    },
    pro: {
      id: "pro",
      prices: [
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY as string,
          amount: 9.9,
          interval: PlanInterval.MONTH,
          trialPeriodDays: 7,
        },
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_YEARLY as string,
          amount: 99,
          interval: PlanInterval.YEAR,
          trialPeriodDays: 30,
        },
      ],
      popular: true,
    },
    lifetime: {
      id: "lifetime",
      prices: [
        {
          type: PaymentType.ONE_TIME,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID_LIFETIME as string,
          amount: 399,
        },
      ],
      isLifetime: true,
    },
    enterprise: {
      id: "enterprise",
      isEnterprise: true,
      highlighted: true,
    },
  },
}
```

## [🔧 提供商特定说明](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%8F%90%E4%BE%9B%E5%95%86%E7%89%B9%E5%AE%9A%E8%AF%B4%E6%98%8E)
### [Stripe 配置](https://nextdevkit.com/zh/docs/payment/configuration#stripe-%E9%85%8D%E7%BD%AE)
  * **`priceId`**：使用 Stripe 价格 ID（以`price_` 开头）
  * **产品** ：在 Stripe 仪表板中创建产品和价格
  * **Webhooks** ：在 `/api/webhooks/stripe` 设置 webhook 端点


### [Creem 配置](https://nextdevkit.com/zh/docs/payment/configuration#creem-%E9%85%8D%E7%BD%AE)
  * **`priceId`**：使用 Creem 产品 ID（以`prod_` 开头）
  * **产品** ：在 Creem 仪表板中创建产品
  * **Webhooks** ：在 `/api/webhooks/creem` 设置 webhook 端点


## [📝 定价表的计划信息](https://nextdevkit.com/zh/docs/payment/configuration#-%E5%AE%9A%E4%BB%B7%E8%A1%A8%E7%9A%84%E8%AE%A1%E5%88%92%E4%BF%A1%E6%81%AF)
您可以在 `src/config/marketing/pricing.ts` 中为每个计划定义定价表的信息。
您可以为每个计划定义标题、描述和功能数组。
我们建议您使用 `t()` 函数获取计划信息的翻译，然后在 `/messages/` 文件夹中定义翻译。
```
export async function getPricingConfig(): Promise<PricingConfig> {
  const t = await getTranslations("pricing");
  const priceConfig = appConfig.payment;
  const plans: PricePlan[] = [];
  if (priceConfig.plans.free) {
    plans.push({
      ...priceConfig.plans.free,
      name: t("products.free.title"),
      description: t("products.free.description"),
      features: [
        t("products.free.features.feature1"),
        t("products.free.features.feature2"),
        t("products.free.features.feature3"),
      ],
    });
  }
  if (priceConfig.plans.pro) {
    plans.push({
      ...priceConfig.plans.pro,
      name: t("products.pro.title"),
      description: t("products.pro.description"),
      features: [
        t("products.pro.features.feature1"),
        t("products.pro.features.feature2"),
        t("products.pro.features.feature3"),
        t("products.pro.features.feature4"),
      ],
    });
  }
  if (priceConfig.plans.lifetime) {
    plans.push({
      ...priceConfig.plans.lifetime,
      name: t("products.lifetime.title"),
      description: t("products.lifetime.description"),
      features: [
        t("products.lifetime.features.feature1"),
        t("products.lifetime.features.feature2"),
        t("products.lifetime.features.feature3"),
      ],
    });
  }
  if (priceConfig.plans.enterprise) {
    plans.push({
      ...priceConfig.plans.enterprise,
      name: t("products.enterprise.title"),
      description: t("products.enterprise.description"),
      features: [
        t("products.enterprise.features.feature1"),
        t("products.enterprise.features.feature2"),
        t("products.enterprise.features.feature3"),
        t("products.enterprise.features.feature4"),
        t("products.enterprise.features.feature5"),
      ],
    });
  }
  return {
    title: t("title"),
    subtitle: t("subtitle"),
    frequencies: [t("frequencies.monthly"), t("frequencies.yearly")],
    yearlyDiscount: priceConfig.yearlyDiscount,
    plans,
  };
}
```

## [🧪 测试配置](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%B5%8B%E8%AF%95%E9%85%8D%E7%BD%AE)
### [测试环境变量](https://nextdevkit.com/zh/docs/payment/configuration#%E6%B5%8B%E8%AF%95%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
```
# Stripe 测试模式
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."
# Creem 测试模式  
CREEM_API_KEY="ck_test_..."
CREEM_WEBHOOK_SECRET="test_webhook_secret"
# 测试价格/产品 ID
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="test_price_monthly"
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="test_price_yearly"
NEXT_PUBLIC_PRICE_ID_LIFETIME="test_price_lifetime"
```

## [🔧 配置故障排除](https://nextdevkit.com/zh/docs/payment/configuration#-%E9%85%8D%E7%BD%AE%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见配置问题](https://nextdevkit.com/zh/docs/payment/configuration#%E5%B8%B8%E8%A7%81%E9%85%8D%E7%BD%AE%E9%97%AE%E9%A2%98)
**找不到提供商** ：
  * 检查 `provider` 设置为 "stripe" 或 "creem"
  * 验证存在正确的提供商实现


**缺少环境变量** ：
  * 确保设置了所有必需的环境变量
  * 检查变量名中的拼写错误
  * 验证测试与生产密钥


**无效的价格/产品 ID** ：
  * 确认 ID 在您的支付提供商仪表板中存在
  * 检查 ID 格式是否符合提供商要求
  * 验证测试与生产 ID


**计划配置错误** ：
  * 确保计划结构符合预期格式
  * 检查必需字段是否存在
  * 验证数据类型与接口定义匹配


* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/payment/configuration#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您的支付配置已设置：
  * 🔧 [学习如何使用支付 API](https://nextdevkit.com/docs/payment/how-to-use)
  * 📘 [完成 Stripe 设置](https://nextdevkit.com/docs/payment/stripe)
  * 📗 [完成 Creem 设置](https://nextdevkit.com/docs/payment/creem)
  * 🔐 [配置身份验证](https://nextdevkit.com/docs/authentication)


[Creem 集成 在 NEXTDEVKIT 中设置和配置 Creem 支付的完整指南](https://nextdevkit.com/zh/docs/payment/creem)[如何使用支付 学习如何在 NEXTDEVKIT 中使用 Stripe 和 Creem 的支付 API](https://nextdevkit.com/zh/docs/payment/how-to-use)
[](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%94%AF%E4%BB%98%E7%B1%BB%E5%9E%8B)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%8F%90%E4%BE%9B%E5%95%86%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment/configuration#%E5%9C%A8%E6%8F%90%E4%BE%9B%E5%95%86%E4%B9%8B%E9%97%B4%E5%88%87%E6%8D%A2)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E5%AE%9A%E4%B9%89%E8%AE%A1%E5%88%92%E5%92%8C%E4%BA%A7%E5%93%81)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E5%85%8D%E8%B4%B9%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E4%BC%81%E4%B8%9A%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E8%AE%A2%E9%98%85%E8%AE%A1%E5%88%92%E5%92%8C--%E4%B8%80%E6%AC%A1%E6%80%A7%E8%B4%AD%E4%B9%B0%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/payment/configuration#%E5%AE%8C%E6%95%B4%E8%AE%A1%E5%88%92%E9%85%8D%E7%BD%AE%E7%A4%BA%E4%BE%8B)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%8F%90%E4%BE%9B%E5%95%86%E7%89%B9%E5%AE%9A%E8%AF%B4%E6%98%8E)[](https://nextdevkit.com/zh/docs/payment/configuration#stripe-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment/configuration#creem-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E5%AE%9A%E4%BB%B7%E8%A1%A8%E7%9A%84%E8%AE%A1%E5%88%92%E4%BF%A1%E6%81%AF)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E6%B5%8B%E8%AF%95%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/payment/configuration#%E6%B5%8B%E8%AF%95%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E9%85%8D%E7%BD%AE%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/payment/configuration#%E5%B8%B8%E8%A7%81%E9%85%8D%E7%BD%AE%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/payment/configuration#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
