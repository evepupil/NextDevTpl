# 来源: https://nextdevkit.com/zh/docs/credits

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
积分系统概述🎯 什么是积分系统？
积分系统
# 积分系统概述
了解 NEXTDEVKIT 中用于管理用户积分、消费和变现的完整积分系统
## [🎯 什么是积分系统？](https://nextdevkit.com/zh/docs/credits#-%E4%BB%80%E4%B9%88%E6%98%AF%E7%A7%AF%E5%88%86%E7%B3%BB%E7%BB%9F)
NEXTDEVKIT 中的积分系统是一个灵活、生产就绪的变现框架，专为 AI 应用、API 服务和任何基于使用量计费的模式而设计。它提供了完整的解决方案：
  * 💰 **一次性积分购买** - 用户购买积分包
  * 🎁 **订阅积分** - 为订阅用户每月发放积分
  * 🎉 **注册奖励** - 为新用户提供欢迎积分
  * 📊 **使用追踪** - 精确的积分消耗监控
  * ⏰ **过期管理** - 使用 FIFO 自动处理积分过期
  * 🔄 **自动发放** - 计划任务每月分发积分


## [🎨 为什么使用积分系统？](https://nextdevkit.com/zh/docs/credits#-%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8%E7%A7%AF%E5%88%86%E7%B3%BB%E7%BB%9F)
### [适合 AI 和 API 服务](https://nextdevkit.com/zh/docs/credits#%E9%80%82%E5%90%88-ai-%E5%92%8C-api-%E6%9C%8D%E5%8A%A1)
如果您正在构建 AI 应用、API 平台或任何需要基于使用量计费的服务，积分系统提供：
  1. **灵活的变现方式** ：结合订阅和按需付费积分
  2. **用户自由度** ：让免费用户购买积分包，无需强制订阅
  3. **可预测的收入** ：混合经常性和一次性收入流
  4. **用户参与工具** ：注册奖励降低新用户的使用门槛


### [主要优势](https://nextdevkit.com/zh/docs/credits#%E4%B8%BB%E8%A6%81%E4%BC%98%E5%8A%BF)
  * ✅ **FIFO 过期机制** ：先进先出的公平积分消费
  * ✅ **复式记账** ：准确的财务追踪和审计
  * ✅ **自动化管理** ：定时任务处理发放和过期
  * ✅ **支付集成** ：无缝集成 Stripe/Creem
  * ✅ **类型安全** ：完整的 TypeScript 支持和 Drizzle ORM
  * ✅ **生产就绪** ：经过实战检验，具有完善的错误处理


## [🏗️ 系统架构](https://nextdevkit.com/zh/docs/credits#%EF%B8%8F-%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)
### [积分流程](https://nextdevkit.com/zh/docs/credits#%E7%A7%AF%E5%88%86%E6%B5%81%E7%A8%8B)
```
┌─────────────────────────────────────────────────────────────┐
│                     积分来源                                  │
├─────────────────────────────────────────────────────────────┤
│  • 注册奖励       • 积分包         • 订阅计划                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │   积分批次             │
    │   (FIFO 队列)          │
    │                        │
    │  ┌──────────────────┐  │
    │  │ 批次 1: 100 积分  │ ← 最早(最先过期)
    │  ├──────────────────┤  │
    │  │ 批次 2: 200 积分  │
    │  ├──────────────────┤  │
    │  │ 批次 3: 50 积分   │ ← 最新
    │  └──────────────────┘  │
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │   积分消费             │
    │   (服务使用)           │
    └────────────────────────┘
```

### [数据库架构](https://nextdevkit.com/zh/docs/credits#%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)
系统使用三个主要表：
**`credits_balance`**- 用户积分余额
```
- id: 用户余额 ID
- userId: 用户引用
- balance: 可用积分
- totalEarned: 累计获得积分
- totalSpent: 累计消费积分
- status: 账户状态 (ACTIVE/FROZEN)
```

**`credits_batch`**- FIFO 积分批次
```
- id: 批次 ID
- userId: 用户引用
- amount: 原始积分数量
- remaining: 剩余积分
- issuedAt: 创建时间戳
- expiresAt: 过期日期 (可为空)
- status: ACTIVE/CONSUMED/EXPIRED
- sourceType: PURCHASE/SUBSCRIPTION/BONUS
- sourcePlan: 计划标识符
- grantPeriod: YYYY-MM 格式的月度发放周期
```

**`credits_transaction`**- 交易历史
```
- id: 交易 ID
- userId: 用户引用
- type: purchase/consumption/monthly_grant/registration_bonus/expiration
- amount: 积分数量 (发放为正，消费为负)
- debitAccount: 复式记账借方账户
- creditAccount: 复式记账贷方账户
- referenceId: 唯一交易引用
- status: COMPLETED/FAILED
```

### [为什么使用复式记账？](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8%E5%A4%8D%E5%BC%8F%E8%AE%B0%E8%B4%A6)
积分系统采用**复式记账** 原则，以实现最高的准确性和可审计性。这是一个关键的设计决策，提供了几个重要优势：
#### [什么是复式记账？](https://nextdevkit.com/zh/docs/credits#%E4%BB%80%E4%B9%88%E6%98%AF%E5%A4%8D%E5%BC%8F%E8%AE%B0%E8%B4%A6)
每笔积分交易记录交易的**两个方面** ：
  * **借方账户（Debit Account）** - 积分来自哪里
  * **贷方账户（Credit Account）** - 积分去往哪里


**交易示例：**
```
{
  type: "purchase",
  amount: 100,
  debitAccount: "PAYMENT:stripe_payment_123",  // 来源
  creditAccount: "WALLET:user_123",            // 目的地
}
```

#### [为什么这样设计？](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E8%BF%99%E6%A0%B7%E8%AE%BE%E8%AE%A1)
**1. 财务准确性和可审计性**
传统的单式记账系统可能会丢失积分轨迹：
```
❌ 单式记账："用户获得 100 积分"
   问题：它们从哪里来？无法追踪来源。
✅ 复式记账："100 积分从 PAYMENT:xyz 转移到 WALLET:user_123"
   清晰：资金轨迹完整且可追溯。
```

**2. 防欺诈和异常检测**
系统可以检测异常：
```
// 如果总借方 ≠ 总贷方，说明有问题
const totalDebits = sumAllDebitTransactions();
const totalCredits = sumAllCreditTransactions();
if (totalDebits !== totalCredits) {
  alert("⚠️ 检测到账目不一致！");
}
```

**3. 全面的财务报告**
您可以生成如下报告：
  * 本月购买的积分与消费的积分各是多少？
  * 哪些服务消耗了最多的积分？
  * 有多少收入与未使用的积分相关？


```
// 示例：追踪积分购买收入
SELECT SUM(amount) FROM credits_transaction 
WHERE debitAccount LIKE 'PAYMENT:%'
AND createdAt >= '2024-01-01'
```

**4. 合规要求**
对于处理资金或将积分作为货币的企业：
  * **SOC 2 合规** ：所有交易的审计轨迹
  * **财务审计** ：清晰的资金流文档
  * **税务报告** ：准确的收入确认


#### [账户结构](https://nextdevkit.com/zh/docs/credits#%E8%B4%A6%E6%88%B7%E7%BB%93%E6%9E%84)
系统使用以下账户类型：
**系统账户** （积分来源）：
  * `SYSTEM:subscription-grant` - 月度订阅积分
  * `SYSTEM:registration-bonus` - 欢迎奖励
  * `PAYMENT:purchase_id` - 购买的积分
  * `SYSTEM:expiration` - 过期积分清理


**用户账户** （积分目的地）：
  * `WALLET:user_id` - 用户积分余额
  * `SERVICE:service_name` - 服务消费


**交易流程示例：**
```
购买：
  PAYMENT:stripe_xyz_123 → WALLET:user_123 (100 积分)
消费：
  WALLET:user_123 → SERVICE:google:chat (2 积分)
过期：
  WALLET:user_123 → SYSTEM:expiration (50 积分)
```

#### [相比简单余额追踪的优势](https://nextdevkit.com/zh/docs/credits#%E7%9B%B8%E6%AF%94%E7%AE%80%E5%8D%95%E4%BD%99%E9%A2%9D%E8%BF%BD%E8%B8%AA%E7%9A%84%E4%BC%98%E5%8A%BF)
**简单余额（❌）：**
```
UPDATE user_balance SET balance = balance + 100
-- 问题：
-- - 没有积分来源的历史记录
-- - 无法追踪差异
-- - 没有审计轨迹
-- - 容易出错
```

**复式记账（✅）：**
```
-- 交易 1：记录转账
INSERT INTO credits_transaction (
  debitAccount: 'PAYMENT:xyz',
  creditAccount: 'WALLET:user_123',
  amount: 100
)
-- 交易 2：更新批次和余额
-- 两者都被跟踪和验证
```

#### [实际场景的优势](https://nextdevkit.com/zh/docs/credits#%E5%AE%9E%E9%99%85%E5%9C%BA%E6%99%AF%E7%9A%84%E4%BC%98%E5%8A%BF)
**场景 1：用户纠纷**
```
用户："我购买了 500 积分，但只有 400！"
使用复式记账，您可以展示：
- 购买：PAYMENT:xyz → WALLET:user (500 积分) ✓
- 消费 1：WALLET:user → SERVICE:chat (50 积分) ✓
- 消费 2：WALLET:user → SERVICE:image (50 积分) ✓
- 总计：500 - 100 = 400 积分 ✓
```

**场景 2：收入对账**
```
CFO："有多少资金被未使用的积分占用？"
查询：
SELECT SUM(amount) FROM credits_transaction
WHERE debitAccount LIKE 'PAYMENT:%'
AND userId IN (SELECT userId FROM credits_balance WHERE balance > 0)
答案：$12,450 的未兑换积分价值
```

**场景 3：系统完整性检查**
```
// 每日完整性检查
async function verifySystemIntegrity() {
  // 汇总所有发放的积分
  const issued = await db
    .select({ total: sum(creditsTransaction.amount) })
    .where(like(creditsTransaction.debitAccount, 'PAYMENT:%'));
  // 汇总所有用户余额
  const balances = await db
    .select({ total: sum(creditsBalance.balance) });
  // 汇总所有消费的积分
  const consumed = await db
    .select({ total: sum(creditsTransaction.amount) })
    .where(like(creditsTransaction.creditAccount, 'SERVICE:%'));
  // issued 应该等于 balances + consumed
  if (issued !== balances + consumed) {
    throw new Error("检测到账目不匹配！");
  }
}
```

#### [设计权衡](https://nextdevkit.com/zh/docs/credits#%E8%AE%BE%E8%AE%A1%E6%9D%83%E8%A1%A1)
**优点：**
  * ✅ 完整的审计轨迹
  * ✅ 欺诈检测
  * ✅ 财务准确性
  * ✅ 合规性
  * ✅ 报告便捷


**缺点：**
  * ⚠️ 实现稍微复杂
  * ⚠️ 更多数据库存储（值得！）
  * ⚠️ 需要理解会计概念


**为什么值得：**
即使是小的积分差异也可能：
  * 导致用户投诉和退款
  * 使追踪错误变得不可能
  * 造成税务和合规问题
  * 损害用户信任


相比于带来的好处，增加的复杂性是最小的，特别是对于处理真实资金的生产系统。
## [💡 工作原理](https://nextdevkit.com/zh/docs/credits#-%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)
### [1. 积分发放(注册奖励示例)](https://nextdevkit.com/zh/docs/credits#1-%E7%A7%AF%E5%88%86%E5%8F%91%E6%94%BE%E6%B3%A8%E5%86%8C%E5%A5%96%E5%8A%B1%E7%A4%BA%E4%BE%8B)
当用户注册时：
```
import { grantRegistrationBonus } from "@/credits/actions";
// 用户注册后自动调用
await grantRegistrationBonus(userId);
```

**执行流程：**
  1. 创建新的积分批次，包含 20 积分（可配置）
  2. 设置过期日期（默认 30 天）
  3. 记录类型为 `registration_bonus` 的交易
  4. 更新用户总余额
  5. 创建复式记账记录


### [2. 积分消费 (FIFO)](https://nextdevkit.com/zh/docs/credits#2-%E7%A7%AF%E5%88%86%E6%B6%88%E8%B4%B9-fifo)
当服务使用积分时：
```
import { consumeCreditsForService } from "@/credits/actions";
// 为 AI 服务消费积分
const result = await consumeCreditsForService({
  userId: "user_123",
  service: "google:chat",  // 消耗 2 积分（已配置）
});
// 或指定自定义数量
const result = await consumeCreditsForService({
  userId: "user_123",
  service: "custom_service",
  amount: 5,  // 自定义数量
  description: "自定义 AI 模型使用",
});
```

**FIFO 流程：**
  1. 获取所有按过期日期排序的活动批次
  2. 从最早的批次开始消费
  3. 如果批次耗尽，移至下一批次
  4. 记录详细的消费日志
  5. 如果批次完全消耗，更新批次状态
  6. 创建交易记录


**示例：**
```
用户拥有：
- 批次 A: 10 积分 (5 天后过期)
- 批次 B: 50 积分 (25 天后过期)
服务需要 15 积分：
→ 从批次 A 消费 10 积分 (现已耗尽)
→ 从批次 B 消费 5 积分 (剩余 45)
```

### [3. 月度订阅积分](https://nextdevkit.com/zh/docs/credits#3-%E6%9C%88%E5%BA%A6%E8%AE%A2%E9%98%85%E7%A7%AF%E5%88%86)
对于订阅计划用户：
```
// 由定时任务自动调用
import { processDailyGrant } from "@/credits/actions";
// 每天 01:00 UTC 运行(可配置)
const results = await processDailyGrant();
```

**执行流程：**
  1. 查找所有活动订阅
  2. 检查订阅创建周年日
  3. 验证本月尚未发放
  4. 发放月度积分（例如 Pro 计划 200 积分）
  5. 记录 `grantPeriod`（YYYY-MM）
  6. 防止重复发放


### [4. 积分过期](https://nextdevkit.com/zh/docs/credits#4-%E7%A7%AF%E5%88%86%E8%BF%87%E6%9C%9F)
自动过期处理：
```
// 由定时任务自动调用
import { processExpiredCredits } from "@/credits/actions";
// 每天运行以处理过期批次
const result = await processExpiredCredits();
```

**执行流程：**
  1. 查找所有 `expiresAt < now()` 的批次
  2. 更新批次状态为 `EXPIRED`
  3. 创建过期交易
  4. 更新用户余额
  5. 维护准确的账目


## [⚙️ 配置说明](https://nextdevkit.com/zh/docs/credits#%EF%B8%8F-%E9%85%8D%E7%BD%AE%E8%AF%B4%E6%98%8E)
### [主配置 (`src/config/index.ts`)](https://nextdevkit.com/zh/docs/credits#%E4%B8%BB%E9%85%8D%E7%BD%AE-srcconfigindexts)
```
export const appConfig = {
  credits: {
    // 启用/禁用整个积分系统
    enabled: true,
    // 注册奖励设置
    registration: {
      enabled: true,
      amount: 20,        // 新用户免费积分
      validityDays: 30,  // 30 天后过期
    },
    // 系统限制
    limitations: {
      allowFreeUserPurchasePackages: true,  // 免费用户可以购买积分
      maxUserBalance: 10000,                 // 最大积分限制
    },
    // 订阅计划的月度积分
    subscription: {
      free: {
        id: "free",
        enabled: true,
        monthlyGrant: 10,    // 免费用户每月 10 积分
        validityDays: 30,
      },
      pro: {
        id: "pro",
        enabled: true,
        monthlyGrant: 200,   // Pro 用户每月 200 积分
        validityDays: 30,
      },
    },
    // 一次性积分包
    packages: {
      lite: {
        id: "lite",
        name: "Lite",
        credits: 100,                              // 基础积分
        priceId: process.env.CREDIT_LITE_PRICE_ID, // Stripe/Creem 价格 ID
        amount: 9.99,                               // 美元价格
        currency: "USD",
        validityDays: 90,                           // 3 个月
        bonus: 10,                                  // 奖励积分
      },
      standard: {
        id: "standard",
        name: "Standard",
        credits: 500,
        priceId: process.env.CREDIT_STANDARD_PRICE_ID,
        amount: 29.99,
        currency: "USD",
        validityDays: 90,
        bonus: 50,
      },
      pro: {
        id: "pro",
        name: "Pro",
        credits: 1500,
        priceId: process.env.CREDIT_PRO_PRICE_ID,
        amount: 79.99,
        currency: "USD",
        popular: true,  // 突出显示此套餐
        validityDays: 90,
        bonus: 200,
      },
      max: {
        id: "max",
        name: "Max",
        credits: 5000,
        priceId: process.env.CREDIT_MAX_PRICE_ID,
        amount: 199.99,
        currency: "USD",
        validityDays: 365,  // 1 年有效期
        bonus: 1000,
      },
    },
    // 不同服务的积分消耗率
    consumption: {
      "google:fast": 1,      // 快速 AI 模型：1 积分
      "google:chat": 2,      // 聊天模型：2 积分
      "google:reasoning": 4, // 高级推理：4 积分
      "google:image": 5,     // 图像生成：5 积分
    },
  },
};
```

### [设计理念](https://nextdevkit.com/zh/docs/credits#%E8%AE%BE%E8%AE%A1%E7%90%86%E5%BF%B5)
#### [为什么使用 FIFO（先进先出）？](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8-fifo%E5%85%88%E8%BF%9B%E5%85%88%E5%87%BA)
FIFO 确保公平性并鼓励及时使用积分：
  * **对用户公平** ：最早的积分先被使用
  * **鼓励参与** ：用户有动力在过期前使用积分
  * **可预测性** ：用户了解哪些积分会先过期
  * **收入优化** ：减少未使用积分的累积


#### [为什么要有过期机制？](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E8%A6%81%E6%9C%89%E8%BF%87%E6%9C%9F%E6%9C%BA%E5%88%B6)
积分过期有多个目的：
  * **防止囤积** ：鼓励积极使用
  * **收入确认** ：有助于财务规划
  * **用户参与** ：为平台使用创造紧迫感
  * **公平变现** ：平衡用户价值和业务需求


#### [配置的影响](https://nextdevkit.com/zh/docs/credits#%E9%85%8D%E7%BD%AE%E7%9A%84%E5%BD%B1%E5%93%8D)
不同的配置会产生不同的结果：
**保守模式** （较长过期时间，较低发放）：
```
registration: { amount: 10, validityDays: 14 },
subscription: {
  pro: { monthlyGrant: 100, validityDays: 30 }
}
```

  * 用户购买更多积分包
  * 付费计划转化率更高
  * 使用模式更可预测


**慷慨模式** （较长过期时间，较高发放）：
```
registration: { amount: 50, validityDays: 90 },
subscription: {
  pro: { monthlyGrant: 500, validityDays: 60 }
}
```

  * 更好的用户体验
  * 更高的留存率
  * 鼓励平台探索
  * 潜在的病毒式增长


## [🚀 快速开始](https://nextdevkit.com/zh/docs/credits#-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
### [步骤 1：配置环境变量](https://nextdevkit.com/zh/docs/credits#%E6%AD%A5%E9%AA%A4-1%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
在 `.env` 文件中添加：
```
# ---------积分系统----------
# 首先在 Stripe/Creem 控制面板中创建这些产品
CREDIT_LITE_PRICE_ID=price_xxx      # Lite 套餐价格 ID
CREDIT_STANDARD_PRICE_ID=price_xxx  # Standard 套餐价格 ID
CREDIT_PRO_PRICE_ID=price_xxx       # Pro 套餐价格 ID
CREDIT_MAX_PRICE_ID=price_xxx       # Max 套餐价格 ID
# ---------定时任务----------
# 生成随机的 16 字符密钥
CRON_SECRET=your-secret-key-here
```

### [步骤 2：在支付提供商中创建价格](https://nextdevkit.com/zh/docs/credits#%E6%AD%A5%E9%AA%A4-2%E5%9C%A8%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%BB%B7%E6%A0%BC)
为每个积分包在 Stripe 或 Creem 中创建**一次性支付产品** ：
**Stripe：**
  1. 进入 Stripe 控制面板 → Products
  2. 点击 "Add product"
  3. 设置定价为一次性支付
  4. 复制价格 ID（以 `price_` 开头）
  5. 添加到环境变量


**Creem：**
  1. 进入 Creem 控制面板 → Products
  2. 创建一次性产品
  3. 复制产品 ID
  4. 添加到环境变量


### [步骤 3：设置定时任务](https://nextdevkit.com/zh/docs/credits#%E6%AD%A5%E9%AA%A4-3%E8%AE%BE%E7%BD%AE%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1)
系统需要两个定时任务：
#### [发放积分定时任务（每天）](https://nextdevkit.com/zh/docs/credits#%E5%8F%91%E6%94%BE%E7%A7%AF%E5%88%86%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E6%AF%8F%E5%A4%A9)
URL: `https://yourdomain.com/api/jobs/credits/grant` 计划: 每天 01:00 UTC 请求头: `Authorization: Bearer your-cron-secret`
#### [过期积分定时任务（每天）](https://nextdevkit.com/zh/docs/credits#%E8%BF%87%E6%9C%9F%E7%A7%AF%E5%88%86%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E6%AF%8F%E5%A4%A9)
URL: `https://yourdomain.com/api/jobs/credits/expire` 计划: 每天 04:00 UTC 请求头: `Authorization: Bearer your-cron-secret`
查看[定时任务设置指南](https://nextdevkit.com/docs/credits/cron-jobs)了解详细的平台特定说明。
## [📖 下一步](https://nextdevkit.com/zh/docs/credits#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
  * 📘 [定时任务设置](https://nextdevkit.com/docs/credits/cron-jobs) - 配置自动积分管理
  * 🔧 [API 参考](https://nextdevkit.com/docs/credits/api-reference) - 学习所有积分函数
  * 💡 [使用示例](https://nextdevkit.com/docs/credits/usage-examples) - 实际实现示例


## [🤔 常见问题](https://nextdevkit.com/zh/docs/credits#-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
### [可以禁用特定计划的积分吗？](https://nextdevkit.com/zh/docs/credits#%E5%8F%AF%E4%BB%A5%E7%A6%81%E7%94%A8%E7%89%B9%E5%AE%9A%E8%AE%A1%E5%88%92%E7%9A%84%E7%A7%AF%E5%88%86%E5%90%97)
可以！在订阅配置中设置 `enabled: false`：
```
subscription: {
  free: {
    enabled: false,  // 免费用户不获得月度积分
  },
}
```

### [免费用户可以购买积分包吗？](https://nextdevkit.com/zh/docs/credits#%E5%85%8D%E8%B4%B9%E7%94%A8%E6%88%B7%E5%8F%AF%E4%BB%A5%E8%B4%AD%E4%B9%B0%E7%A7%AF%E5%88%86%E5%8C%85%E5%90%97)
由 `allowFreeUserPurchasePackages` 控制：
```
limitations: {
  allowFreeUserPurchasePackages: true,  // 允许
}
```

### [积分过期时会发生什么？](https://nextdevkit.com/zh/docs/credits#%E7%A7%AF%E5%88%86%E8%BF%87%E6%9C%9F%E6%97%B6%E4%BC%9A%E5%8F%91%E7%94%9F%E4%BB%80%E4%B9%88)
  * 批次状态更改为 `EXPIRED`
  * 从用户余额中扣除积分
  * 创建审计交易记录
  * 不通知用户（您可以实现通知功能）


### [如何追踪积分使用情况？](https://nextdevkit.com/zh/docs/credits#%E5%A6%82%E4%BD%95%E8%BF%BD%E8%B8%AA%E7%A7%AF%E5%88%86%E4%BD%BF%E7%94%A8%E6%83%85%E5%86%B5)
使用用户交易页面或直接查询：
```
import { getUserTransactions } from "@/credits/actions";
const { items } = await getUserTransactions({
  userId: "user_123",
  pageIndex: 0,
  pageSize: 10,
});
```

* * *
## [📚 相关文档](https://nextdevkit.com/zh/docs/credits#-%E7%9B%B8%E5%85%B3%E6%96%87%E6%A1%A3)
  * 💳 [支付集成](https://nextdevkit.com/docs/payment) - 设置 Stripe 或 Creem
  * 🗄️ [数据库架构](https://nextdevkit.com/docs/database) - 了解数据结构
  * ⚙️ [配置说明](https://nextdevkit.com/docs/configuration) - 应用配置指南


[如何使用支付 学习如何在 NEXTDEVKIT 中使用 Stripe 和 Creem 的支付 API](https://nextdevkit.com/zh/docs/payment/how-to-use)[定时任务设置 使用各种定时任务平台配置自动积分发放和过期处理](https://nextdevkit.com/zh/docs/credits/cron-jobs)
[](https://nextdevkit.com/zh/docs/credits#-%E4%BB%80%E4%B9%88%E6%98%AF%E7%A7%AF%E5%88%86%E7%B3%BB%E7%BB%9F)[](https://nextdevkit.com/zh/docs/credits#-%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8%E7%A7%AF%E5%88%86%E7%B3%BB%E7%BB%9F)[](https://nextdevkit.com/zh/docs/credits#%E9%80%82%E5%90%88-ai-%E5%92%8C-api-%E6%9C%8D%E5%8A%A1)[](https://nextdevkit.com/zh/docs/credits#%E4%B8%BB%E8%A6%81%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/credits#%EF%B8%8F-%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/credits#%E7%A7%AF%E5%88%86%E6%B5%81%E7%A8%8B)[](https://nextdevkit.com/zh/docs/credits#%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8%E5%A4%8D%E5%BC%8F%E8%AE%B0%E8%B4%A6)[](https://nextdevkit.com/zh/docs/credits#%E4%BB%80%E4%B9%88%E6%98%AF%E5%A4%8D%E5%BC%8F%E8%AE%B0%E8%B4%A6)[](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E8%BF%99%E6%A0%B7%E8%AE%BE%E8%AE%A1)[](https://nextdevkit.com/zh/docs/credits#%E8%B4%A6%E6%88%B7%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/credits#%E7%9B%B8%E6%AF%94%E7%AE%80%E5%8D%95%E4%BD%99%E9%A2%9D%E8%BF%BD%E8%B8%AA%E7%9A%84%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/credits#%E5%AE%9E%E9%99%85%E5%9C%BA%E6%99%AF%E7%9A%84%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/credits#%E8%AE%BE%E8%AE%A1%E6%9D%83%E8%A1%A1)[](https://nextdevkit.com/zh/docs/credits#-%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86)[](https://nextdevkit.com/zh/docs/credits#1-%E7%A7%AF%E5%88%86%E5%8F%91%E6%94%BE%E6%B3%A8%E5%86%8C%E5%A5%96%E5%8A%B1%E7%A4%BA%E4%BE%8B)[](https://nextdevkit.com/zh/docs/credits#2-%E7%A7%AF%E5%88%86%E6%B6%88%E8%B4%B9-fifo)[](https://nextdevkit.com/zh/docs/credits#3-%E6%9C%88%E5%BA%A6%E8%AE%A2%E9%98%85%E7%A7%AF%E5%88%86)[](https://nextdevkit.com/zh/docs/credits#4-%E7%A7%AF%E5%88%86%E8%BF%87%E6%9C%9F)[](https://nextdevkit.com/zh/docs/credits#%EF%B8%8F-%E9%85%8D%E7%BD%AE%E8%AF%B4%E6%98%8E)[`src/config/index.ts`)](https://nextdevkit.com/zh/docs/credits#%E4%B8%BB%E9%85%8D%E7%BD%AE-srcconfigindexts)[](https://nextdevkit.com/zh/docs/credits#%E8%AE%BE%E8%AE%A1%E7%90%86%E5%BF%B5)[](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8-fifo%E5%85%88%E8%BF%9B%E5%85%88%E5%87%BA)[](https://nextdevkit.com/zh/docs/credits#%E4%B8%BA%E4%BB%80%E4%B9%88%E8%A6%81%E6%9C%89%E8%BF%87%E6%9C%9F%E6%9C%BA%E5%88%B6)[](https://nextdevkit.com/zh/docs/credits#%E9%85%8D%E7%BD%AE%E7%9A%84%E5%BD%B1%E5%93%8D)[](https://nextdevkit.com/zh/docs/credits#-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)[](https://nextdevkit.com/zh/docs/credits#%E6%AD%A5%E9%AA%A4-1%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/credits#%E6%AD%A5%E9%AA%A4-2%E5%9C%A8%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86%E4%B8%AD%E5%88%9B%E5%BB%BA%E4%BB%B7%E6%A0%BC)[](https://nextdevkit.com/zh/docs/credits#%E6%AD%A5%E9%AA%A4-3%E8%AE%BE%E7%BD%AE%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1)[](https://nextdevkit.com/zh/docs/credits#%E5%8F%91%E6%94%BE%E7%A7%AF%E5%88%86%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E6%AF%8F%E5%A4%A9)[](https://nextdevkit.com/zh/docs/credits#%E8%BF%87%E6%9C%9F%E7%A7%AF%E5%88%86%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E6%AF%8F%E5%A4%A9)[](https://nextdevkit.com/zh/docs/credits#-%E4%B8%8B%E4%B8%80%E6%AD%A5)[](https://nextdevkit.com/zh/docs/credits#-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/credits#%E5%8F%AF%E4%BB%A5%E7%A6%81%E7%94%A8%E7%89%B9%E5%AE%9A%E8%AE%A1%E5%88%92%E7%9A%84%E7%A7%AF%E5%88%86%E5%90%97)[](https://nextdevkit.com/zh/docs/credits#%E5%85%8D%E8%B4%B9%E7%94%A8%E6%88%B7%E5%8F%AF%E4%BB%A5%E8%B4%AD%E4%B9%B0%E7%A7%AF%E5%88%86%E5%8C%85%E5%90%97)[](https://nextdevkit.com/zh/docs/credits#%E7%A7%AF%E5%88%86%E8%BF%87%E6%9C%9F%E6%97%B6%E4%BC%9A%E5%8F%91%E7%94%9F%E4%BB%80%E4%B9%88)[](https://nextdevkit.com/zh/docs/credits#%E5%A6%82%E4%BD%95%E8%BF%BD%E8%B8%AA%E7%A7%AF%E5%88%86%E4%BD%BF%E7%94%A8%E6%83%85%E5%86%B5)[](https://nextdevkit.com/zh/docs/credits#-%E7%9B%B8%E5%85%B3%E6%96%87%E6%A1%A3)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
