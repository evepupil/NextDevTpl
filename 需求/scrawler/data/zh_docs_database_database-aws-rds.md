# 来源: https://nextdevkit.com/zh/docs/database/database-aws-rds

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
AWS RDS 数据库🚀 为什么选择 AWS RDS？
数据库指南
# AWS RDS 数据库
NEXTDEVKIT 的完整 AWS RDS 设置指南，包含 SST 配置和托管 PostgreSQL 服务。
AWS RDS 是 NEXTDEVKIT 的 SST AWS 部署的**默认数据库** ，提供具有企业级功能、自动扩展和高可用性的托管 PostgreSQL。
## [🚀 为什么选择 AWS RDS？](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-aws-rds)
选择 AWS RDS 用于 SST AWS 部署是因为：
  * **🛡️ 托管服务** ：自动备份、补丁和维护
  * **📈 自动扩展** ：自动存储和计算扩展
  * **🔒 企业安全** ：VPC 隔离、加密和 IAM 集成
  * **🌐 高可用性** ：生产工作负载的多可用区部署
  * **⚡ 性能** ：为高性能应用程序优化
  * **📊 监控** ：CloudWatch 集成和性能洞察


## [🏗️ 架构概述](https://nextdevkit.com/zh/docs/database/database-aws-rds#%EF%B8%8F-%E6%9E%B6%E6%9E%84%E6%A6%82%E8%BF%B0)
### [SST + RDS 架构](https://nextdevkit.com/zh/docs/database/database-aws-rds#sst--rds-%E6%9E%B6%E6%9E%84)
NEXTDEVKIT 使用 **SST** 来配置和管理 AWS RDS 基础设施：
组件 | Next.js 应用 (Lambda) | AWS RDS (PostgreSQL) | AWS VPC (网络)  
---|---|---|---  
**核心功能** | 🚀 API 路由 | 🗄️ 主数据库 | 🔒 私有子网  
| ⚙️ 服务器 | 📖 只读副本 | 🛡️ 安全组  
| 🧩 组件 | 💾 备份 |   
|  | 📊 监控 |   
**支持服务** | ☁️ CloudFront (CDN) | 🔗 RDS 代理 (连接) | 🔐 密钥管理器  
## [🔧 SST 配置](https://nextdevkit.com/zh/docs/database/database-aws-rds#-sst-%E9%85%8D%E7%BD%AE)
### [1. SST 配置设置](https://nextdevkit.com/zh/docs/database/database-aws-rds#1-sst-%E9%85%8D%E7%BD%AE%E8%AE%BE%E7%BD%AE)
在您的 `sst.config.ts` 中将默认数据库提供商更改为 AWS RDS：
例如，您可以将实例类型更改为其他类型，如 `t4g.medium` 或 `t4g.large` 以获得更好的性能。
您需要将数据库名称更改为您自己的数据库名称。
```
// sst.config.ts
// 创建 RDS PostgreSQL 实例
const database = new sst.aws.Postgres("NextDevKitDB", {
  instance: "t4g.micro",          // 实例类型
  storage: "20 GB",               // 存储大小
  version: "16.4",                // PostgreSQL 版本
  vpc,                            // VPC 引用
  proxy: true,                    // 启用 RDS 代理
  password: $dev
    ? process.env.DATABASE_PASSWORD
    : new sst.Secret("NextDevKitDBPassword").value,
  dev: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  },
});
```

## [🔧 环境配置](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)
### [1. 开发环境](https://nextdevkit.com/zh/docs/database/database-aws-rds#1-%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83)
设置本地开发环境变量：
```
# .env.local
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=your-database-name
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-local-password
DATABASE_URL=postgresql://postgres:your-local-password@localhost:5432/your-database-name
```

### [2. 生产密钥](https://nextdevkit.com/zh/docs/database/database-aws-rds#2-%E7%94%9F%E4%BA%A7%E5%AF%86%E9%92%A5)
使用 SST 配置生产密钥：
```
# 设置生产密钥
sst secret set NextDevKitDBPassword "your-secure-database-password"
```

其他字段由 sst 自动设置。
src/database/client.ts
```
const pool = new Pool({
	host: Resource.NextDevKitDB.host,
	port: Resource.NextDevKitDB.port,
	user: Resource.NextDevKitDB.username,
	password: Resource.NextDevKitDB.password,
	database: Resource.NextDevKitDB.database,
});
export const db = drizzle(pool);
```

## [🗄️ 数据库架构和客户端](https://nextdevkit.com/zh/docs/database/database-aws-rds#%EF%B8%8F-%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84%E5%92%8C%E5%AE%A2%E6%88%B7%E7%AB%AF)
### [数据库客户端配置](https://nextdevkit.com/zh/docs/database/database-aws-rds#%E6%95%B0%E6%8D%AE%E5%BA%93%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%85%8D%E7%BD%AE)
为 AWS RDS 配置数据库客户端：
src/database/client.ts
```
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Resource } from "sst";
const pool = new Pool({
	host: Resource.NextDevKitDB.host,
	port: Resource.NextDevKitDB.port,
	user: Resource.NextDevKitDB.username,
	password: Resource.NextDevKitDB.password,
	database: Resource.NextDevKitDB.database,
});
export const db = drizzle(pool);
```

## [🚀 部署和管理](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E9%83%A8%E7%BD%B2%E5%92%8C%E7%AE%A1%E7%90%86)
### [1. 部署基础设施](https://nextdevkit.com/zh/docs/database/database-aws-rds#1-%E9%83%A8%E7%BD%B2%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD)
部署您的 SST 基础设施：
```
# 部署到开发环境
npx sst deploy --stage dev
# 部署到生产环境
npx sst deploy --stage production
```

### [2. 数据库迁移](https://nextdevkit.com/zh/docs/database/database-aws-rds#2-%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)
在部署后运行数据库迁移：
```
# 生成迁移
pnpm db:generate
```

NEXTDEVKIT 使用 lambda 处理程序运行迁移，它会在部署时自动触发。
```
// sst.config.ts
if (!$dev) {
  new aws.lambda.Invocation("DatabaseMigratorInvocation", {
    input: Date.now().toString(),
    functionName: migrator.name,
  });
}
```

## [🔍 监控和可观察性](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E7%9B%91%E6%8E%A7%E5%92%8C%E5%8F%AF%E8%A7%82%E5%AF%9F%E6%80%A7)
### [CloudWatch 集成](https://nextdevkit.com/zh/docs/database/database-aws-rds#cloudwatch-%E9%9B%86%E6%88%90)
SST 自动设置 CloudWatch 监控：
## [🛠️ 故障排除](https://nextdevkit.com/zh/docs/database/database-aws-rds#%EF%B8%8F-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/database/database-aws-rds#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
**连接超时** ：
  * 检查 VPC 安全组
  * 验证 RDS 代理配置
  * 确保 Lambda 具有 VPC 访问权限


**连接限制** ：
  * 使用 RDS 代理进行连接池
  * 优化连接生命周期
  * 监控连接指标


## [🔗 相关资源](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您了解了数据库架构，深入了解您选择的平台的具体设置：
### [身份验证 设置用户身份验证和授权，支持 OAuth 等多种提供商。](https://nextdevkit.com/docs/authentication)### [支付 集成 Stripe 来处理支付和订阅，支持灵活的定价计划。](https://nextdevkit.com/docs/payment)
[Cloudflare D1 数据库 NEXTDEVKIT 边缘部署的完整 Cloudflare D1 设置指南，包含 D1 和 KV 配置。](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1)[概述 学习如何在 NEXTDEVKIT 中使用 Better Auth 设置和使用身份验证](https://nextdevkit.com/zh/docs/authentication)
[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-aws-rds)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#%EF%B8%8F-%E6%9E%B6%E6%9E%84%E6%A6%82%E8%BF%B0)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#sst--rds-%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-sst-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#1-sst-%E9%85%8D%E7%BD%AE%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#1-%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#2-%E7%94%9F%E4%BA%A7%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#%EF%B8%8F-%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84%E5%92%8C%E5%AE%A2%E6%88%B7%E7%AB%AF)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#%E6%95%B0%E6%8D%AE%E5%BA%93%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E9%83%A8%E7%BD%B2%E5%92%8C%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#1-%E9%83%A8%E7%BD%B2%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#2-%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E7%9B%91%E6%8E%A7%E5%92%8C%E5%8F%AF%E8%A7%82%E5%AF%9F%E6%80%A7)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#cloudwatch-%E9%9B%86%E6%88%90)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#%EF%B8%8F-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)[](https://nextdevkit.com/zh/docs/database/database-aws-rds#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
