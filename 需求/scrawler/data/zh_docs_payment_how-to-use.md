# 来源: https://nextdevkit.com/zh/docs/payment/how-to-use

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
如何使用支付🔧 支付提供商架构
配置支付模块
# 如何使用支付
学习如何在 NEXTDEVKIT 中使用 Stripe 和 Creem 的支付 API
## [🔧 支付提供商架构](https://nextdevkit.com/zh/docs/payment/how-to-use#-%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E6%9E%B6%E6%9E%84)
NEXTDEVKIT 使用提供商模式来支持多个支付系统。Stripe 和 Creem 都实现相同的接口，使在提供商之间切换变得容易。
### [提供商接口](https://nextdevkit.com/zh/docs/payment/how-to-use#%E6%8F%90%E4%BE%9B%E5%95%86%E6%8E%A5%E5%8F%A3)
src/payment/types.ts
```
export interface PaymentProvider {
  createCheckoutLink(params: CreateCheckoutLinkParams): Promise<string>;
  createCustomerPortalLink(params: CreatePortalLinkParams): Promise<string>;
  handleWebhook(payload: string, signature: string): Promise<void>;
}
```

### [Stripe 提供商实现](https://nextdevkit.com/zh/docs/payment/how-to-use#stripe-%E6%8F%90%E4%BE%9B%E5%95%86%E5%AE%9E%E7%8E%B0)
src/payment/providers/stripe.ts
```
import Stripe from 'stripe';
import { PaymentProvider, CreateCheckoutLinkParams } from '@/payment/types';
export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }
  async createCheckoutLink(params: CreateCheckoutLinkParams): Promise<string> {
    //...代码的其余部分
    return session.url!;
  }
  async createCustomerPortalLink(params: CreatePortalLinkParams): Promise<string> {
    //...代码的其余部分
    return session.url!;
  }
  async handleWebhook(payload: string, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`未处理的事件类型：${event.type}`);
    }
  }
}
```

### [Creem 提供商实现](https://nextdevkit.com/zh/docs/payment/how-to-use#creem-%E6%8F%90%E4%BE%9B%E5%95%86%E5%AE%9E%E7%8E%B0)
src/payment/providers/creem.ts
```
import { createHmac } from "node:crypto";
import { PaymentProvider, CreateCheckoutLinkParams } from '@/payment/types';
export class CreemProvider implements PaymentProvider {
  async createCheckoutLink(params: CreateCheckoutLinkParams): Promise<string> {
    //...代码的其余部分
    return checkout_url;
  }
  async createCustomerPortalLink(params: CreatePortalLinkParams): Promise<string> {
    //...代码的其余部分
    return customer_portal_link;
  }
  async handleWebhook(payload: string, signature: string): Promise<void> {
    // 验证 webhook 签名
    //...代码的其余部分
    const event = JSON.parse(payload);
    switch (event.eventType) {
      case "checkout.completed":
        await this.handleOneTimePayment(event);
        break;
      case "subscription.active":
        await this.handleSubscriptionActive(event);
        break;
      case "subscription.trialing":
        await this.handleSubscriptionTrialing(event);
        break;
      case "subscription.canceled":
      case "subscription.expired":
        await this.handleSubscriptionCanceled(event);
        break;
      default:
        console.log(`未处理的 Creem 事件：${event.eventType}`);
    }
  }
}
```

## [🔄 Webhooks](https://nextdevkit.com/zh/docs/payment/how-to-use#-webhooks)
### [Stripe Webhook 处理器](https://nextdevkit.com/zh/docs/payment/how-to-use#stripe-webhook-%E5%A4%84%E7%90%86%E5%99%A8)
src/app/api/webhooks/stripe/route.ts
```
import { getPaymentProvider } from '@/payment/providers';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  try {
    const paymentProvider = getPaymentProvider();
    await paymentProvider.handleWebhook(payload, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook 错误：', error);
    return NextResponse.json(
      { error: 'Webhook 处理程序失败' },
      { status: 400 }
    );
  }
}
```

### [Creem Webhook 处理器](https://nextdevkit.com/zh/docs/payment/how-to-use#creem-webhook-%E5%A4%84%E7%90%86%E5%99%A8)
src/app/api/webhooks/creem/route.ts
```
import { getPaymentProvider } from '@/payment/providers';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('creem-signature')!;
  try {
    const paymentProvider = getPaymentProvider();
    await paymentProvider.handleWebhook(payload, signature);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Creem webhook 错误：', error);
    return NextResponse.json(
      { error: 'Webhook 处理程序失败' },
      { status: 400 }
    );
  }
}
```

## [💳 前端使用](https://nextdevkit.com/zh/docs/payment/how-to-use#-%E5%89%8D%E7%AB%AF%E4%BD%BF%E7%94%A8)
### [创建结账链接](https://nextdevkit.com/zh/docs/payment/how-to-use#%E5%88%9B%E5%BB%BA%E7%BB%93%E8%B4%A6%E9%93%BE%E6%8E%A5)
```
import { createCheckoutLink } from '@/payment/actions';
import { PaymentType } from '@/payment/types';
// 在您的 React 组件中
const handleSubscribe = async (priceId: string) => {
  const result = await createCheckoutLink({
    type: PaymentType.SUBSCRIPTION,
    priceId: priceId,
    redirectUrl: window.location.origin + "/app/dashboard",
  });
  if (result.data?.checkoutUrl) {
    window.location.href = result.data.checkoutUrl;
  }
};
// 与不同提供商的使用
// 相同的代码对 Stripe 和 Creem 都有效！
<button onClick={() => handleSubscribe("price_monthly")}>
  月付订阅
</button>
```

### [客户门户访问](https://nextdevkit.com/zh/docs/payment/how-to-use#%E5%AE%A2%E6%88%B7%E9%97%A8%E6%88%B7%E8%AE%BF%E9%97%AE)
```
import { createCustomerPortal } from '@/payment/actions';
const handleManageBilling = async () => {
  const result = await createCustomerPortal({
    customerId: user.customerId,
    redirectUrl: window.location.href,
  });
  if (result.data?.portalUrl) {
    window.location.href = result.data.portalUrl;
  }
};
<button onClick={handleManageBilling}>
  管理账单
</button>
```

* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/payment/how-to-use#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您了解了如何使用支付系统：
  * 📘 [设置 Stripe 集成](https://nextdevkit.com/docs/payment/stripe)
  * 📗 [设置 Creem 集成](https://nextdevkit.com/docs/payment/creem)
  * ⚙️ [配置您的定价计划](https://nextdevkit.com/docs/payment/configuration)
  * 🔐 [了解身份验证](https://nextdevkit.com/docs/authentication)


[支付配置 学习如何在 NEXTDEVKIT 中为 Stripe 和 Creem 配置定价和支付计划](https://nextdevkit.com/zh/docs/payment/configuration)[积分系统概述 了解 NEXTDEVKIT 中用于管理用户积分、消费和变现的完整积分系统](https://nextdevkit.com/zh/docs/credits)
[](https://nextdevkit.com/zh/docs/payment/how-to-use#-%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/payment/how-to-use#%E6%8F%90%E4%BE%9B%E5%95%86%E6%8E%A5%E5%8F%A3)[](https://nextdevkit.com/zh/docs/payment/how-to-use#stripe-%E6%8F%90%E4%BE%9B%E5%95%86%E5%AE%9E%E7%8E%B0)[](https://nextdevkit.com/zh/docs/payment/how-to-use#creem-%E6%8F%90%E4%BE%9B%E5%95%86%E5%AE%9E%E7%8E%B0)[](https://nextdevkit.com/zh/docs/payment/how-to-use#-webhooks)[](https://nextdevkit.com/zh/docs/payment/how-to-use#stripe-webhook-%E5%A4%84%E7%90%86%E5%99%A8)[](https://nextdevkit.com/zh/docs/payment/how-to-use#creem-webhook-%E5%A4%84%E7%90%86%E5%99%A8)[](https://nextdevkit.com/zh/docs/payment/how-to-use#-%E5%89%8D%E7%AB%AF%E4%BD%BF%E7%94%A8)[](https://nextdevkit.com/zh/docs/payment/how-to-use#%E5%88%9B%E5%BB%BA%E7%BB%93%E8%B4%A6%E9%93%BE%E6%8E%A5)[](https://nextdevkit.com/zh/docs/payment/how-to-use#%E5%AE%A2%E6%88%B7%E9%97%A8%E6%88%B7%E8%AE%BF%E9%97%AE)[](https://nextdevkit.com/zh/docs/payment/how-to-use#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
