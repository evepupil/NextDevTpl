# NextDevTpl 优化 Roadmap

> 基于 2025-05-30 全项目审计分析制定。分 4 个阶段，按优先级从安全修复到体验打磨。

---

## Phase 0: 安全关键修复 (P0)

**目标：消除可被利用的安全漏洞，必须优先完成。**

### 0.1 Webhook 签名强制验证

- **文件：** `src/features/payment/creem.ts:264`
- **问题：** `CREEM_WEBHOOK_SECRET` 未配置时降级为空字符串 `""`，攻击者可伪造 webhook 请求
- **修复：** 未配置时抛出明确错误，禁止降级

### 0.2 销毁操作添加 Schema 校验

- **文件：** `src/features/settings/actions/delete-account.ts`
- **问题：** `deleteAccountAction` 无任何 schema 校验
- **修复：** 添加 `z.object({ confirm: z.literal(true) })` 确认 schema
- **可选：** 同样修复 `cancelSubscription`（`src/features/payment/actions.ts`）

---

## Phase 1: 代码清理 & 依赖瘦身 (P1)

**目标：移除死代码和冗余依赖，减少维护负担和 bundle 体积。**

### 1.1 移除未使用的 npm 包

```bash
pnpm remove stripe archiver swr @axiomhq/pino
```
- `stripe` — 项目已迁移到 Creem，零引用
- `archiver` — 零引用
- `swr` — 零引用
- `@axiomhq/pino` — 因 Turbopack 兼容问题已弃用（注释掉），零引用

### 1.2 修复依赖类型错误

- **文件：** `package.json`
- **问题：** `@types/mdx` 放在 `dependencies` 而非 `devDependencies`
- **修复：** 移动到 `devDependencies`

### 1.3 清理 Radix UI 重复依赖

- **问题：** 同时安装了 `radix-ui` 元包 + 15 个独立 `@radix-ui/react-*`
- **方案 A（推荐）：** 移除非 `@radix-ui/react-slot` 引入，修改使用 meta 包的导入方式，删除独立包，保留 `radix-ui` 并补充缺失的 `@radix-ui/react-alert-dialog`
- **方案 B：** 删除 `radix-ui` 元包，安装 `@radix-ui/react-alert-dialog`，修改 `button.tsx` 从 `@radix-ui/react-slot` 导入

### 1.4 清理 `next.config.mjs` 残留配置

- **文件：** `next.config.mjs`
- **问题：** `serverExternalPackages` 包含已删除功能 `anki-apkg-export`、`sql.js`
- **修复：** 移除这两项

### 1.5 移除死代码

| 死代码 | 文件 |
|--------|------|
| `export *` barrel（从未被 import） | `src/features/index.ts` |
| 空 barrel `export {}` | `src/features/auth/hooks/index.ts` |
| `sendBulkEmail` | `src/features/mail/utils.ts:193` |
| `deleteFileAction` | `src/features/storage/actions.ts:110` |
| `createCustomerPortal` | `src/features/payment/actions.ts:78` |
| `verifyCreemWebhookSignature` | `src/features/payment/creem.ts:236` |
| Stripe 残余类型 `provider: "stripe"` | `src/features/payment/types.ts:123` |

### 1.6 修复 Biome Lint Errors

- 18 个 error（主要是 `noNonNullAssertion`，集中在 test 文件）
- `biome.json` schema 版本不匹配（2.4.16 vs 2.3.11），需运行 `biome migrate`

---

## Phase 2: 架构 & 工程化升级 (P2)

**目标：改善代码可维护性、补齐测试覆盖、统一模块边界。**

### 2.1 拆分超大文件

| 文件 | 行数 | 拆分方案 |
|------|------|---------|
| `src/features/credits/core.ts` | 618 | 拆为 `grant.ts`、`consume.ts`、`expire.ts`、`errors.ts`，`index.ts` 统一导出 |
| `src/features/settings/components/settings-profile-view.tsx` | 510 | 拆为独立子组件：`AvatarUpload`、`ProfileForm`、`AccountDeleteDialog` |
| `src/features/credits/actions.ts` | 413 | 按域拆分：`purchase-actions.ts`、`usage-actions.ts` |
| `src/features/marketing/components/pricing-section.tsx` | 380 | 提取 `PriceCard`、`PlanFeatureList` 子组件 |
| `src/features/dashboard/components/sidebar.tsx` | 341 | 提取 `UserMenu`、`MobileSheet` 子组件 |
| `src/features/support/actions/ticket.ts` | 337 | 拆为 `user-ticket.ts`、`admin-ticket.ts` |
| `src/features/credits/components/transaction-history.tsx` | 313 | 提取 `TransactionRow`、`Pagination` 子组件 |
| `src/features/auth/components/sign-up-form.tsx` | 311 | 提取 `OAuthSection`、`CooldownTimer` 子组件 |

### 2.2 统一 Feature 模块 Barrel Export

- **目标：** 15/15 个 feature 模块均提供顶层 `index.ts`
- **缺失模块：** `auth`、`admin`、`dashboard`、`blog`、`marketing`、`pseo`、`support`
- **规范：** 使用命名导出（参考 `subscription/index.ts` 的 pattern）

### 2.3 修复架构分层

- **问题：** `shared` 模块依赖 `marketing/constants`（Cookie 常量）
- **修复：** 将 Cookie 常量移到 `@/lib/cookie-constants.ts` 或 `@/config/cookie.ts`，让 `shared` 从 foundation 层导入

### 2.4 补齐关键测试覆盖

| 目标 | 风险 |
|------|------|
| `src/features/subscription/services/user-plan.ts` | 核心计费逻辑，零覆盖 |
| `src/features/settings/actions/delete-account.ts` | 销毁操作，零覆盖 |
| `src/lib/safe-action.ts` | 所有 action 的基础设施，零覆盖 |
| `src/lib/auth/admin.ts` | admin 鉴权逻辑，零覆盖 |
| `src/lib/ai/openai.ts` | AI 多 provider 切换，零覆盖 |

### 2.5 扩展 Coverage 范围

- **文件：** `vitest.config.ts`
- **修复：** 将 `src/lib/` 纳入 coverage include，排除纯 UI 工具

---

## Phase 3: i18n & 体验打磨 (P3)

**目标：消除硬编码字符串，完成真正的全站双语支持。**

### 3.1 Footer 组件国际化

- **文件：** `src/features/marketing/components/footer.tsx`
- **问题：** 5+ 处硬编码英文，未使用 `useTranslations`
- **修复：** 添加 `Footer` section 到 en.json / zh.json，接入 `useTranslations`

### 3.2 Admin 侧边栏国际化

- **文件：** `src/features/admin/components/admin-sidebar.tsx`
- **问题：** 中英文混写硬编码
- **修复：** 添加 `AdminSidebar` section 到消息文件

### 3.3 导航配置国际化

- **文件：** `src/config/nav.ts`
- **问题：** dashboard nav 硬编码英文，admin nav 硬编码中文
- **修复：** 改为函数 `getNav(t)` 接受翻译函数参数

### 3.4 Support 模块国际化

- **文件：** 5 个文件（schema、form、status-select、role-select）
- **问题：** 30+ 处硬编码中文（toast、placeholder、enum label、Zod error message）
- **修复：** 将 category/priority/status label 提取到消息文件

### 3.5 Root Layout HTML lang 动态化

- **文件：** `src/app/layout.tsx`
- **问题：** `<html lang="en">` 写死，OG `locale: "en_US"` 写死
- **修复：** 根据实际 locale param 动态设置

### 3.6 清理空消息键

- **文件：** `messages/en.json`、`messages/zh.json`
- **问题：** `Flashcards`、`Decks`、`AnonymousGenerate`、`Solutions` 空对象残留
- **修复：** 删除或标注 TODO

### 3.7 Site 配置占位符更新

- **文件：** `src/config/site.ts`
- **问题：** `hello@example.com`、`twitter.com/example` 等占位符
- **修复：** 更新为实际值或接入环境变量

---

## Phase 4: 日志 & 运维标准化 (P4)

**目标：统一日志出口，确保所有服务端日志进入结构化管道。**

### 4.1 Webhook 日志迁移到结构化 Logger

- **文件：** `src/app/api/webhooks/creem/route.ts`
- **问题：** 20+ 处 `console.log/error`，绕过 Sentry + Axiom
- **修复：** 全部替换为 `logger.info/error` 或 `logEvent/logError`

### 4.2 Cron 任务日志迁移

- **文件：** `src/app/api/jobs/credits/expire/route.ts`
- **问题：** `console.warn/error` 替代结构化日志
- **修复：** 全部替换为 `logger.warn/error`

### 4.3 部署脚本更新

- **文件：** `deploy-build.bat`、`start-prod.sh`
- **问题：** 旧项目名 `NextjsTpl`、占位符 IP
- **修复：** 更新为当前项目名，提取可配置变量

---

## 实施建议

| Phase | 预计工时 | 风险 | 依赖 |
|-------|---------|------|------|
| Phase 0 | 0.5 天 | 低 | 无 |
| Phase 1 | 1 天 | 低（主要是删除操作） | Phase 0 完 |
| Phase 2 | 3-5 天 | 中（重构可能引入 bug） | Phase 1 完 |
| Phase 3 | 2-3 天 | 低 | 可与 Phase 2 并行 |
| Phase 4 | 0.5 天 | 低 | 无依赖 |

**建议执行策略：** Phase 0 → Phase 1（快速见效）→ Phase 2 + Phase 3（并行）→ Phase 4

每个 Phase 完成后跑一次 lint + typecheck + test 确保无回归。
