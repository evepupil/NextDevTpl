# 来源: https://nextdevkit.com/zh/docs/database/database-cloudflare-d1

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)
[](https://nextdevkit.com/zh/docs/database)[](https://nextdevkit.com/zh/docs/database/database-postgresql)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1)[](https://nextdevkit.com/zh/docs/database/database-aws-rds)
[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
Cloudflare D1 数据库🚀 为什么选择 Cloudflare D1？
数据库指南
# Cloudflare D1 数据库
NEXTDEVKIT 边缘部署的完整 Cloudflare D1 设置指南，包含 D1 和 KV 配置。
Cloudflare D1 是 NEXTDEVKIT 的 Cloudflare Workers 部署的**默认数据库** ，提供全球边缘数据库，具有低延迟和自动复制功能。
## [🚀 为什么选择 Cloudflare D1？](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-cloudflare-d1)
选择 Cloudflare D1 用于 Cloudflare Workers 部署是因为：
  * **⚡ 边缘性能** ：数据库在边缘运行，贴近用户
  * **🌍 全球复制** ：全球自动数据复制
  * **🔧 SQLite 兼容** ：熟悉的 SQL 语法和操作
  * **💰 成本效益** ：按使用付费的定价模式
  * **🔄 无服务器扩展** ：与您的 Workers 自动扩展
  * **🛡️ 内置安全** ：与 Cloudflare 的安全功能集成


## [🏗️ 数据库架构](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%EF%B8%8F-%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)
### [D1 + KV 存储架构](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#d1--kv-%E5%AD%98%E5%82%A8%E6%9E%B6%E6%9E%84)
NEXTDEVKIT 使用 **Cloudflare D1** 存储结构化数据，使用 **Cloudflare KV** 作为缓存：
组件 | Next.js 应用 (Worker) | Cloudflare D1 (数据库) | Cloudflare KV (缓存)  
---|---|---|---  
目的 | 边缘应用程序 | 结构化数据存储 | 缓存层  
功能 | 页面 | 用户数据 | 缓存数据  
| API 路由 | 支付 | 临时数据  
| 中间件 | 设置 |   
## [🔧 初始设置](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E5%88%9D%E5%A7%8B%E8%AE%BE%E7%BD%AE)
### [1. 创建 D1 数据库](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#1-%E5%88%9B%E5%BB%BA-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)
为您的 NEXTDEVKIT 项目创建新的 D1 数据库：
```
# 创建 D1 数据库
pnpm wrangler d1 create prod-d1-tutorial
```

**预期输出** ：
```
   ✅ Successfully created DB 'prod-d1-tutorial' in region WEUR
   Created your new D1 database.
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "prod-d1-tutorial",
         "database_id": "<unique-ID-for-your-database>"
       }
     ]
   }
```

### [2. 创建 KV 命名空间](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#2-%E5%88%9B%E5%BB%BA-kv-%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)
为缓存和会话存储创建 KV 命名空间：
```
# 创建 KV 命名空间
pnpm wrangler kv namespace create nextdevkit-cloudflare-template-kv
```

**预期输出** ：
```
🌀 Creating namespace with title "USERS_NOTIFICATION_CONFIG"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{
  "kv_namespaces": [
    {
      "binding": "USERS_NOTIFICATION_CONFIG",
      "id": "<BINDING_ID>"
    }
  ]
}
```

### [3. 配置 wrangler.jsonc](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#3-%E9%85%8D%E7%BD%AE-wranglerjsonc)
使用数据库和 KV 配置更新您的 `wrangler.jsonc` 文件：
```
// wrangler.jsonc
{
  "name": "nextdevkit-cloudflare-template",
  "compatibility_flags": ["nodejs_compat"],
  // D1 数据库配置
  "d1_databases": [
    {
      "binding": "NEXT_TAG_CACHE_D1",
      "database_name": "your-database-name",
      "database_id": "<unique-ID-for-your-database>",
      "migrations_dir": "drizzle"
    }
  ],
  // KV 命名空间配置
  "kv_namespaces": [
    {
      "binding": "NEXT_INC_CACHE_KV",
      "id": "<unique-ID-for-your-namespace>"
    }
  ],
}
```

您只需将 `database_name`、`database_id` 和 kv_namespaces `id` 更改为您自己的数据库名称和命名空间 ID。
请不要更改 `d1_databases` 和 `kv_namespaces` 的默认绑定名称，如果您想更改名称如 `NEXT_TAG_CACHE_D1` 为 `DB`，您需要搜索名称并更新代码以使用新名称。
src/database/client.ts
```
const { env } = await getCloudflareContext({ async: true });
if (!env.NEXT_TAG_CACHE_D1) {
  throw new Error("D1 database not found");
}
dbInstance = drizzle(env.NEXT_TAG_CACHE_D1, { schema, logger: true });
return dbInstance;
```

您需要在全局范围内搜索所有名称以找到绑定名称，并更新代码以使用新名称。
## [🔧 本地开发设置](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91%E8%AE%BE%E7%BD%AE)
### [1. 创建本地 D1 数据库](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#1-%E5%88%9B%E5%BB%BA%E6%9C%AC%E5%9C%B0-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)
在本地开发环境中初始化 D1 数据库：
```
# 创建本地 D1 数据库
npx wrangler d1 execute your-database-name --local --command='SELECT 1'
```

需要注意 `your-database-name` 需要与 wrangler.jsonc 中的 database_name 一致。
## [🗄️ 数据库架构配置](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%EF%B8%8F-%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84%E9%85%8D%E7%BD%AE)
### [架构定义](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E6%9E%B6%E6%9E%84%E5%AE%9A%E4%B9%89)
D1 使用与 PostgreSQL 相同的架构，但使用 SQLite 语法：
src/database/schema.ts
```
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  ...
});
```

### [数据库客户端配置](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E6%95%B0%E6%8D%AE%E5%BA%93%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%85%8D%E7%BD%AE)
Cloudflare Workers 配置 D1 客户端在代码目录 `src/database/client.ts` 中。你可以直接使用该 d1 客户端来操作数据库。
src/database/client.ts
```
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
// 对于 Cloudflare Workers
...
// 对于本地开发
...
export { getDB as db };
```

## [🔄 架构迁移](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E6%9E%B6%E6%9E%84%E8%BF%81%E7%A7%BB)
### [迁移配置](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E8%BF%81%E7%A7%BB%E9%85%8D%E7%BD%AE)
为 D1 迁移配置 Drizzle：
```
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  ...
});
```

### [迁移命令](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E8%BF%81%E7%A7%BB%E5%91%BD%E4%BB%A4)
```
pnpm run db:generate
pnpm run db:migrate:dev
pnpm run db:migrate:prod
```

### [工作室](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E5%B7%A5%E4%BD%9C%E5%AE%A4)
如果您想在 cloudflare d1 生产环境中使用 drizzle studio，您可以使用 drizzle chrome 扩展连接到数据库。
## [🔍 监控和调试](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E7%9B%91%E6%8E%A7%E5%92%8C%E8%B0%83%E8%AF%95)
### [D1 分析](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#d1-%E5%88%86%E6%9E%90)
在 Cloudflare 仪表板中监控 D1 性能：
  * 查询执行时间
  * 数据库大小和使用情况
  * 错误率和类型
  * 地理性能指标


### [KV 分析](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#kv-%E5%88%86%E6%9E%90)
监控 KV 操作：
  * 读/写操作
  * 缓存命中率
  * 存储使用情况
  * 地理分布


## [🛠️ 故障排除](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%EF%B8%8F-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
**D1 连接错误** ：
  * 验证 `wrangler.jsonc` 中的数据库 ID
  * 检查绑定名称是否与代码使用匹配
  * 确保已应用迁移


**KV 访问问题** ：
  * 验证 KV 命名空间 ID
  * 检查绑定配置
  * 确保适当的权限


**迁移失败** ：
  * 查看 SQLite 语法兼容性
  * 检查约束违规
  * 验证架构更改是否有效


## [🔗 相关资源](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您了解了数据库架构，深入了解您选择的平台的具体设置：
### [身份验证 设置用户身份验证和授权，支持 OAuth 等多种提供商。](https://nextdevkit.com/docs/authentication)### [支付 集成 Stripe 来处理支付和订阅，支持灵活的定价计划。](https://nextdevkit.com/docs/payment)
[PostgreSQL 数据库 NEXTDEVKIT 的完整 PostgreSQL 设置指南，包括云提供商和自托管选项。](https://nextdevkit.com/zh/docs/database/database-postgresql)[AWS RDS 数据库 NEXTDEVKIT 的完整 AWS RDS 设置指南，包含 SST 配置和托管 PostgreSQL 服务。](https://nextdevkit.com/zh/docs/database/database-aws-rds)
[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-cloudflare-d1)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%EF%B8%8F-%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#d1--kv-%E5%AD%98%E5%82%A8%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E5%88%9D%E5%A7%8B%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#1-%E5%88%9B%E5%BB%BA-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#2-%E5%88%9B%E5%BB%BA-kv-%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#3-%E9%85%8D%E7%BD%AE-wranglerjsonc)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#1-%E5%88%9B%E5%BB%BA%E6%9C%AC%E5%9C%B0-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%EF%B8%8F-%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E6%9E%B6%E6%9E%84%E5%AE%9A%E4%B9%89)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E6%95%B0%E6%8D%AE%E5%BA%93%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E6%9E%B6%E6%9E%84%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E8%BF%81%E7%A7%BB%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E8%BF%81%E7%A7%BB%E5%91%BD%E4%BB%A4)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E5%B7%A5%E4%BD%9C%E5%AE%A4)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E7%9B%91%E6%8E%A7%E5%92%8C%E8%B0%83%E8%AF%95)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#d1-%E5%88%86%E6%9E%90)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#kv-%E5%88%86%E6%9E%90)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%EF%B8%8F-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)[](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
