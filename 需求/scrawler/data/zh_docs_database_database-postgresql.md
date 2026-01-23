# 来源: https://nextdevkit.com/zh/docs/database/database-postgresql

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
PostgreSQL 数据库🚀 为什么选择 PostgreSQL？
数据库指南
# PostgreSQL 数据库
NEXTDEVKIT 的完整 PostgreSQL 设置指南，包括云提供商和自托管选项。
PostgreSQL 是 NEXTDEVKIT 标准 Next.js 部署的**默认数据库** ，提供强大的功能、出色的性能和广泛的托管支持。
## [🚀 为什么选择 PostgreSQL？](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-postgresql)
选择 PostgreSQL 作为 NEXTDEVKIT 的默认数据库是因为：
  * **🔧 功能齐全** ：支持复杂查询、事务和关系
  * **📊 ACID 合规** ：确保数据完整性和一致性
  * **🌐 广泛支持** ：在大多数托管平台上可用
  * **🎯 开发者友好** ：出色的工具和文档
  * **⚡ 性能** ：为读写操作优化
  * **🔒 安全性** ：企业级安全功能


### [环境变量](https://nextdevkit.com/zh/docs/database/database-postgresql#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
在 `.env.local` 中配置您的 PostgreSQL 连接：
```
# PostgreSQL 连接
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
```

## [🌐 云 PostgreSQL 提供商](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E4%BA%91-postgresql-%E6%8F%90%E4%BE%9B%E5%95%86)
### [1. Neon（推荐）](https://nextdevkit.com/zh/docs/database/database-postgresql#1-neon%E6%8E%A8%E8%8D%90)
**Neon** 是专为无服务器应用程序设计的现代 PostgreSQL 平台：
**功能** ：
  * 🚀 无服务器 PostgreSQL
  * 🔄 自动扩展
  * 🎯 慷慨的免费层
  * ⚡ 即时配置
  * 🔀 开发分支


**设置步骤** ：
  1. 在 
  2. 创建新项目
  3. 复制连接字符串
  4. 添加到您的 `.env.local` 或 `.env`：


### [2. Supabase](https://nextdevkit.com/zh/docs/database/database-postgresql#2-supabase)
**Supabase** 提供完整的后端即服务和 PostgreSQL：
**功能** ：
  * 🗄️ PostgreSQL 数据库
  * 🔐 内置身份验证
  * 📡 实时订阅
  * 🎨 管理仪表板
  * 🔒 行级安全


**设置步骤** ：
  1. 在 
  2. 创建新项目
  3. 导航到设置 → 数据库
  4. 复制连接字符串
  5. 添加到您的 `.env.local` 或 `.env`：


## [🔄 架构管理和迁移](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E6%9E%B6%E6%9E%84%E7%AE%A1%E7%90%86%E5%92%8C%E8%BF%81%E7%A7%BB)
### [更新数据库架构](https://nextdevkit.com/zh/docs/database/database-postgresql#%E6%9B%B4%E6%96%B0%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)
  1. **修改架构文件** ： 编辑 `src/database/schema.ts` 来添加/修改表：


```
// 添加新表
export const post = pgTable("post", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("authorId").references(() => user.id),
  published: boolean("published").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
// 添加关系
export const postRelations = relations(post, ({ one }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
}));
```

  1. **生成迁移** ：
```
pnpm db:generate
```

  2. **查看迁移** ： 检查 `drizzle/` 目录中生成的 SQL 文件
  3. **应用迁移** ：
```
pnpm db:push
```



### [迁移文件](https://nextdevkit.com/zh/docs/database/database-postgresql#%E8%BF%81%E7%A7%BB%E6%96%87%E4%BB%B6)
生成的迁移文件存储在 `drizzle/` 目录中：
## [🔍 数据库工作室](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E6%95%B0%E6%8D%AE%E5%BA%93%E5%B7%A5%E4%BD%9C%E5%AE%A4)
### [使用 Drizzle Studio](https://nextdevkit.com/zh/docs/database/database-postgresql#%E4%BD%BF%E7%94%A8-drizzle-studio)
启动可视化数据库管理界面：
```
pnpm db:studio
```

**功能** ：
  * 📊 浏览表数据
  * ✏️ 就地编辑记录
  * 🔍 运行自定义 SQL 查询
  * 🎯 查看表关系
  * 📈 监控查询性能


## [🛠️ 故障排除](https://nextdevkit.com/zh/docs/database/database-postgresql#%EF%B8%8F-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/database/database-postgresql#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
**连接错误** ：
  * 验证 `DATABASE_URL` 是否正确
  * 检查防火墙设置
  * 确保 PostgreSQL 正在运行
  * 验证 SSL 要求


**迁移失败** ：
  * 检查架构中的语法错误
  * 验证外键约束
  * 确保数据库权限
  * 查看迁移日志


**性能问题** ：
  * 添加数据库索引
  * 优化查询结构
  * 监控连接池使用情况
  * 检查 N+1 查询问题


## [🔗 相关资源](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您了解了数据库架构，深入了解您选择的平台的具体设置：
### [身份验证 设置用户身份验证和授权，支持 OAuth 等多种提供商。](https://nextdevkit.com/docs/authentication)### [支付 集成 Stripe 来处理支付和订阅，支持灵活的定价计划。](https://nextdevkit.com/docs/payment)
[如何选择和使用数据库 学习如何选择和使用 NextDevKit 的数据库代码，快速搭建你的业务模型。](https://nextdevkit.com/zh/docs/database)[Cloudflare D1 数据库 NEXTDEVKIT 边缘部署的完整 Cloudflare D1 设置指南，包含 D1 和 KV 配置。](https://nextdevkit.com/zh/docs/database/database-cloudflare-d1)
[](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-postgresql)[](https://nextdevkit.com/zh/docs/database/database-postgresql#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E4%BA%91-postgresql-%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/database/database-postgresql#1-neon%E6%8E%A8%E8%8D%90)[](https://nextdevkit.com/zh/docs/database/database-postgresql#2-supabase)[](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E6%9E%B6%E6%9E%84%E7%AE%A1%E7%90%86%E5%92%8C%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/database/database-postgresql#%E6%9B%B4%E6%96%B0%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/database/database-postgresql#%E8%BF%81%E7%A7%BB%E6%96%87%E4%BB%B6)[](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E6%95%B0%E6%8D%AE%E5%BA%93%E5%B7%A5%E4%BD%9C%E5%AE%A4)[](https://nextdevkit.com/zh/docs/database/database-postgresql#%E4%BD%BF%E7%94%A8-drizzle-studio)[](https://nextdevkit.com/zh/docs/database/database-postgresql#%EF%B8%8F-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/database/database-postgresql#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)[](https://nextdevkit.com/zh/docs/database/database-postgresql#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
