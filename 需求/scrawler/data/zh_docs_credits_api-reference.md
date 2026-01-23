# 来源: https://nextdevkit.com/zh/docs/credits/api-reference

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)
[](https://nextdevkit.com/zh/docs/credits)[](https://nextdevkit.com/zh/docs/credits/cron-jobs)[](https://nextdevkit.com/zh/docs/credits/api-reference)
[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
API 参考📚 概述
积分系统
# API 参考
积分系统函数和服务器操作的完整 API 参考
## [📚 概述](https://nextdevkit.com/zh/docs/credits/api-reference#-%E6%A6%82%E8%BF%B0)
本页面记录了积分系统中所有可用的函数和服务器操作。所有函数都完全支持 TypeScript 类型安全，并与 Drizzle ORM 集成。
## [🔧 配置函数](https://nextdevkit.com/zh/docs/credits/api-reference#-%E9%85%8D%E7%BD%AE%E5%87%BD%E6%95%B0)
从 `@/config/credits` 导入
### [`isCreditsEnabled()`](https://nextdevkit.com/zh/docs/credits/api-reference#iscreditsenabled)
检查积分系统是否已启用。
**用法：**
```
import { isCreditsEnabled } from "@/config/credits";
if (isCreditsEnabled()) {
  // 积分系统已激活
}
```

**返回：** `boolean`
* * *
### [`getCreditPackages()`](https://nextdevkit.com/zh/docs/credits/api-reference#getcreditpackages)
获取所有可用的积分包。
**用法：**
```
import { getCreditPackages } from "@/config/credits";
const packages = getCreditPackages();
// [{ id: 'lite', credits: 100, ... }, ...]
```

**返回：** `CreditPackage[]`
* * *
### [`getCreditPackageById(id: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#getcreditpackagebyidid-string)
通过 ID 获取特定的积分包。
**参数：**
  * `id` - 包 ID（例如 "lite"、"standard"、"pro"、"max"）


**用法：**
```
import { getCreditPackageById } from "@/config/credits";
const package = getCreditPackageById("pro");
if (package) {
  console.log(`${package.name}: ${package.credits} 积分，售价 $${package.amount}`);
}
```

**返回：** `CreditPackage | null`
* * *
### [`getCreditConsumption(service: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#getcreditconsumptionservice-string)
获取服务的积分消耗率。
**参数：**
  * `service` - 服务标识符（例如 "google:chat"、"google:image"）


**用法：**
```
import { getCreditConsumption } from "@/config/credits";
const cost = getCreditConsumption("google:chat");
console.log(`聊天每次请求消耗 ${cost} 积分`);
```

**返回：** `number` - 每次使用消耗的积分（如果未配置则默认为 1）
* * *
### [`getSubscriptionPlanCredits(planId: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#getsubscriptionplancreditsplanid-string)
获取订阅计划的积分配置。
**参数：**
  * `planId` - 计划标识符（例如 "free"、"pro"）


**用法：**
```
import { getSubscriptionPlanCredits } from "@/config/credits";
const planCredits = getSubscriptionPlanCredits("pro");
if (planCredits?.enabled) {
  console.log(`Pro 用户每月获得 ${planCredits.monthlyGrant} 积分`);
}
```

**返回：** `PlanCreditsConfig | null`
* * *
### [`isRegistrationCreditsEnabled()`](https://nextdevkit.com/zh/docs/credits/api-reference#isregistrationcreditsenabled)
检查是否启用了注册奖励积分。
**用法：**
```
import { isRegistrationCreditsEnabled } from "@/config/credits";
if (isRegistrationCreditsEnabled()) {
  await grantRegistrationBonus(userId);
}
```

**返回：** `boolean`
* * *
### [`allowFreeUserPurchasePackages()`](https://nextdevkit.com/zh/docs/credits/api-reference#allowfreeuserpurchasepackages)
检查免费用户是否可以购买积分包。
**用法：**
```
import { allowFreeUserPurchasePackages } from "@/config/credits";
if (!isPaidUser && !allowFreeUserPurchasePackages()) {
  return "升级以购买积分";
}
```

**返回：** `boolean`
* * *
## [💰 积分发放函数](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%A7%AF%E5%88%86%E5%8F%91%E6%94%BE%E5%87%BD%E6%95%B0)
从 `@/credits/actions` 导入
### [`grantCredits(params: GrantCreditsParams)`](https://nextdevkit.com/zh/docs/credits/api-reference#grantcreditsparams-grantcreditsparams)
向用户发放积分的核心函数。
**参数：**
```
interface GrantCreditsParams {
  userId: string;              // 用户 ID
  amount: number;              // 要发放的积分
  type: CreditTransactionType; // 交易类型
  validityDays?: number;       // 过期天数
  sourcePlan?: string;         // 来源计划 ID
  grantPeriod?: string;        // YYYY-MM 格式的月度发放
  description?: string;        // 交易描述
  packageId?: string;          // 积分包 ID
  purchaseId?: string;         // 购买记录 ID
}
```

**用法：**
```
import { grantCredits, CreditTransactionType } from "@/credits/actions";
const result = await grantCredits({
  userId: "user_123",
  amount: 100,
  type: CreditTransactionType.PURCHASE,
  validityDays: 90,
  packageId: "lite",
  description: "购买 Lite 套餐",
});
console.log(`交易 ID: ${result.transactionId}`);
console.log(`过期时间: ${result.expirationDate}`);
```

**返回：**
```
{
  transactionId: string;
  batchId?: string;
  expirationDate?: Date;
}
```

* * *
### [`grantRegistrationBonus(userId: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#grantregistrationbonususerid-string)
向新用户发放注册奖励积分。
**参数：**
  * `userId` - 用户 ID


**用法：**
```
import { grantRegistrationBonus } from "@/credits/actions";
// 在用户注册后调用
const result = await grantRegistrationBonus("user_123");
```

**返回：** `Promise<{ transactionId: string; batchId?: string; expirationDate?: Date; }>`
* * *
### [`grantSubscriptionCredits()`](https://nextdevkit.com/zh/docs/credits/api-reference#grantsubscriptioncredits)
向订阅用户发放月度积分。
**参数：**
```
userId: string;
amount: number;
planId: string;
validityDays: number;
grantPeriod?: string;  // YYYY-MM 格式
purchaseId?: string;
```

**用法：**
```
import { grantSubscriptionCredits } from "@/credits/actions";
await grantSubscriptionCredits(
  "user_123",
  200,           // 数量
  "pro",         // 计划 ID
  30,            // 有效天数
  "2024-01",     // 发放周期
  "purchase_id"
);
```

**返回：** `Promise<{ transactionId: string; batchId?: string; expirationDate?: Date; }>`
* * *
### [`grantPurchasedCredits(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#grantpurchasedcreditsparams)
在购买积分包后发放积分。
**参数：**
```
{
  userId: string;
  priceId: string;   // Stripe/Creem 价格 ID
  purchaseId: string; // 购买记录 ID
}
```

**用法：**
```
import { grantPurchasedCredits } from "@/credits/actions";
// 由支付 webhook 调用
await grantPurchasedCredits({
  userId: "user_123",
  priceId: "price_xxx",
  purchaseId: "purchase_xxx",
});
```

**返回：** `Promise<void>`
* * *
## [🔥 积分消费函数](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%A7%AF%E5%88%86%E6%B6%88%E8%B4%B9%E5%87%BD%E6%95%B0)
### [`consumeCreditsForService(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#consumecreditsforserviceparams)
为服务使用消费积分。
**参数：**
```
{
  userId: string;
  service: string;           // 服务标识符
  amount?: number;           // 可选：覆盖配置的数量
  description?: string;
  metadata?: Record<string, any>;
}
```

**用法：**
```
import { consumeCreditsForService } from "@/credits/actions";
// 使用配置的消耗率
const result = await consumeCreditsForService({
  userId: "user_123",
  service: "google:chat",
});
// 或指定自定义数量
const result = await consumeCreditsForService({
  userId: "user_123",
  service: "custom_ai",
  amount: 10,
  description: "自定义 AI 模型推理",
  metadata: { model: "gpt-4", tokens: 1500 },
});
console.log(`消耗: ${result.consumedAmount} 积分`);
console.log(`新余额: ${result.newBalance} 积分`);
```

**返回：**
```
{
  transactionId: string;
  consumedAmount: number;
  newBalance: number;
  consumptionLog: Array<{
    batchId: string;
    consumed: number;
    batchRemaining: number;
  }>;
}
```

**错误：**
  * 如果积分不足则抛出 `Error`
  * 如果服务/数量无效则抛出 `Error`


* * *
### [`consumeCreditsWithFIFO(params: ConsumeCreditsParams)`](https://nextdevkit.com/zh/docs/credits/api-reference#consumecreditswithfifoparams-consumecreditsparams)
底层 FIFO 积分消费（被 `consumeCreditsForService` 使用）。
**参数：**
```
interface ConsumeCreditsParams {
  userId: string;
  amount: number;
  service: string;
  description?: string;
  metadata?: Record<string, any>;
}
```

**返回：**
```
{
  transactionId: string;
  consumptionLog: Array<{
    batchId: string;
    consumed: number;
    batchRemaining: number;
  }>;
  newBalance: number;
}
```

* * *
## [📊 查询函数](https://nextdevkit.com/zh/docs/credits/api-reference#-%E6%9F%A5%E8%AF%A2%E5%87%BD%E6%95%B0)
### [`getUserCreditsInfo(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#getusercreditsinfoparams)
获取用户的综合积分信息。
**参数：**
```
{
  userId: string;
}
```

**用法：**
```
import { getUserCreditsInfo } from "@/credits/actions";
const { data } = await getUserCreditsInfo({ userId: "user_123" });
if (data) {
  console.log(`可用: ${data.availableCredits}`);
  if (data.nextExpiringBatch) {
    console.log(`即将过期: ${data.nextExpiringBatch.amount} 于 ${data.nextExpiringBatch.expiresAt}`);
  }
  if (data.nextGrantInfo) {
    console.log(`下次发放: ${data.nextGrantInfo.amount} 于 ${data.nextGrantInfo.grantDate}`);
  }
}
```

**返回：**
```
{
  data?: {
    availableCredits: number;
    nextExpiringBatch: {
      amount: number;
      expiresAt: Date;
    } | null;
    nextGrantInfo: {
      amount: number;
      grantDate: Date;
      planName: string;
    } | null;
  };
  serverError?: string;
}
```

* * *
### [`getUserTransactions(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#getusertransactionsparams)
获取用户的积分交易历史，支持分页。
**参数：**
```
{
  userId: string;
  pageIndex?: number;  // 默认: 0
  pageSize?: number;   // 默认: 10, 最大: 100
}
```

**用法：**
```
import { getUserTransactions } from "@/credits/actions";
const { data } = await getUserTransactions({
  userId: "user_123",
  pageIndex: 0,
  pageSize: 20,
});
if (data) {
  console.log(`总交易: ${data.total}`);
  console.log(`页数: ${data.pageCount}`);
  data.items.forEach(transaction => {
    console.log(`${transaction.type}: ${transaction.amount} 积分`);
  });
}
```

**返回：**
```
{
  data?: {
    items: Array<{
      id: string;
      type: string;
      amount: number;
      description: string | null;
      status: string;
      sourcePlan: string | null;
      createdAt: Date;
    }>;
    total: number;
    pageIndex: number;
    pageSize: number;
    pageCount: number;
  };
  serverError?: string;
}
```

* * *
## [🤖 自动化任务](https://nextdevkit.com/zh/docs/credits/api-reference#-%E8%87%AA%E5%8A%A8%E5%8C%96%E4%BB%BB%E5%8A%A1)
### [`processDailyGrant()`](https://nextdevkit.com/zh/docs/credits/api-reference#processdailygrant)
处理每日订阅积分发放（由 cron 调用）。
**用法：**
```
import { processDailyGrant } from "@/credits/actions";
// 由 /api/jobs/credits/grant 调用
const results = await processDailyGrant();
console.log(`已处理: ${results.processed}`);
console.log(`成功: ${results.successful}`);
console.log(`跳过: ${results.skipped}`);
console.log(`失败: ${results.failed}`);
```

**返回：**
```
{
  processed: number;   // 已处理的订阅总数
  successful: number;  // 成功发放
  skipped: number;     // 本周期已发放
  failed: number;      // 发放失败
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
    transactionId?: string;
    amount?: number;
    grantPeriod?: string;
  }>;
}
```

* * *
### [`processExpiredCredits()`](https://nextdevkit.com/zh/docs/credits/api-reference#processexpiredcredits)
处理过期的积分批次（由 cron 调用）。
**用法：**
```
import { processExpiredCredits } from "@/credits/actions";
// 由 /api/jobs/credits/expire 调用
const result = await processExpiredCredits();
console.log(`已过期批次: ${result.processedBatches}`);
console.log(`受影响用户: ${result.processedUsers}`);
console.log(`总过期积分: ${result.totalExpiredAmount}`);
```

**返回：**
```
{
  processedBatches: number;
  processedUsers: number;
  totalExpiredAmount: number;
}
```

* * *
## [🎯 类型](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%B1%BB%E5%9E%8B)
### [`CreditTransactionType`](https://nextdevkit.com/zh/docs/credits/api-reference#credittransactiontype)
```
enum CreditTransactionType {
  PURCHASE = "purchase",
  CONSUMPTION = "consumption",
  MONTHLY_GRANT = "monthly_grant",
  REGISTRATION_BONUS = "registration_bonus",
  EXPIRATION = "expiration",
}
```

### [`CreditPackage`](https://nextdevkit.com/zh/docs/credits/api-reference#creditpackage)
```
interface CreditPackage {
  id: string;
  name?: string;
  description?: string;
  credits: number;
  priceId: string;
  amount: number;
  currency: string;
  popular?: boolean;
  validityDays?: number;
  bonus: number;
}
```

### [`PlanCreditsConfig`](https://nextdevkit.com/zh/docs/credits/api-reference#plancreditsconfig)
```
interface PlanCreditsConfig {
  id: string;
  enabled: boolean;
  monthlyGrant: number;
  validityDays: number;
}
```

* * *
## [🛡️ 错误处理](https://nextdevkit.com/zh/docs/credits/api-reference#%EF%B8%8F-%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86)
所有函数都正确处理错误并抛出类型化异常：
```
try {
  await consumeCreditsForService({
    userId: "user_123",
    service: "google:chat",
  });
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("Insufficient credits")) {
      // 处理积分不足
      showUpgradeModal();
    } else if (error.message.includes("User balance not found")) {
      // 处理余额缺失
      await initializeUserBalance();
    } else {
      // 处理其他错误
      console.error("积分操作失败:", error.message);
    }
  }
}
```

## [📚 相关文档](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%9B%B8%E5%85%B3%E6%96%87%E6%A1%A3)
  * 🎯 [积分系统概述](https://nextdevkit.com/docs/credits) - 系统架构和概念
  * 📘 [定时任务设置](https://nextdevkit.com/docs/credits/cron-jobs) - 配置自动化任务
  * 💡 [使用示例](https://nextdevkit.com/docs/credits/usage-examples) - 实际示例


[定时任务设置 使用各种定时任务平台配置自动积分发放和过期处理](https://nextdevkit.com/zh/docs/credits/cron-jobs)[AI 集成 学习如何在 NEXTDEVKIT 中集成和使用 Vercel AI SDK，构建强大的 AI 功能](https://nextdevkit.com/zh/docs/ai-integration)
[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E6%A6%82%E8%BF%B0)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E9%85%8D%E7%BD%AE%E5%87%BD%E6%95%B0)[`isCreditsEnabled()`](https://nextdevkit.com/zh/docs/credits/api-reference#iscreditsenabled)[`getCreditPackages()`](https://nextdevkit.com/zh/docs/credits/api-reference#getcreditpackages)[`getCreditPackageById(id: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#getcreditpackagebyidid-string)[`getCreditConsumption(service: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#getcreditconsumptionservice-string)[`getSubscriptionPlanCredits(planId: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#getsubscriptionplancreditsplanid-string)[`isRegistrationCreditsEnabled()`](https://nextdevkit.com/zh/docs/credits/api-reference#isregistrationcreditsenabled)[`allowFreeUserPurchasePackages()`](https://nextdevkit.com/zh/docs/credits/api-reference#allowfreeuserpurchasepackages)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%A7%AF%E5%88%86%E5%8F%91%E6%94%BE%E5%87%BD%E6%95%B0)[`grantCredits(params: GrantCreditsParams)`](https://nextdevkit.com/zh/docs/credits/api-reference#grantcreditsparams-grantcreditsparams)[`grantRegistrationBonus(userId: string)`](https://nextdevkit.com/zh/docs/credits/api-reference#grantregistrationbonususerid-string)[`grantSubscriptionCredits()`](https://nextdevkit.com/zh/docs/credits/api-reference#grantsubscriptioncredits)[`grantPurchasedCredits(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#grantpurchasedcreditsparams)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%A7%AF%E5%88%86%E6%B6%88%E8%B4%B9%E5%87%BD%E6%95%B0)[`consumeCreditsForService(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#consumecreditsforserviceparams)[`consumeCreditsWithFIFO(params: ConsumeCreditsParams)`](https://nextdevkit.com/zh/docs/credits/api-reference#consumecreditswithfifoparams-consumecreditsparams)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E6%9F%A5%E8%AF%A2%E5%87%BD%E6%95%B0)[`getUserCreditsInfo(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#getusercreditsinfoparams)[`getUserTransactions(params)`](https://nextdevkit.com/zh/docs/credits/api-reference#getusertransactionsparams)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E8%87%AA%E5%8A%A8%E5%8C%96%E4%BB%BB%E5%8A%A1)[`processDailyGrant()`](https://nextdevkit.com/zh/docs/credits/api-reference#processdailygrant)[`processExpiredCredits()`](https://nextdevkit.com/zh/docs/credits/api-reference#processexpiredcredits)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%B1%BB%E5%9E%8B)[`CreditTransactionType`](https://nextdevkit.com/zh/docs/credits/api-reference#credittransactiontype)[`CreditPackage`](https://nextdevkit.com/zh/docs/credits/api-reference#creditpackage)[`PlanCreditsConfig`](https://nextdevkit.com/zh/docs/credits/api-reference#plancreditsconfig)[](https://nextdevkit.com/zh/docs/credits/api-reference#%EF%B8%8F-%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86)[](https://nextdevkit.com/zh/docs/credits/api-reference#-%E7%9B%B8%E5%85%B3%E6%96%87%E6%A1%A3)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
