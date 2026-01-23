# 来源: https://nextdevkit.com/zh/docs/database

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
如何选择和使用数据库选择什么数据库
数据库指南
# 如何选择和使用数据库
学习如何选择和使用 NextDevKit 的数据库代码，快速搭建你的业务模型。
在配置和学习完前端 UI 组件怎么使用后，我们接下来一步就是深入 NextDevKit 的后端逻辑，快速搭建你的业务模型。
从这一步开始，你将深入了解 NextDevKit 的架构和各个模块，学习如何使用已有的模块代码快速搭建你的业务模型。
## [选择什么数据库](https://nextdevkit.com/zh/docs/database#%E9%80%89%E6%8B%A9%E4%BB%80%E4%B9%88%E6%95%B0%E6%8D%AE%E5%BA%93)
数据库对于大部分项目来说是必不可少的，不管是登录注册，购买付费逻辑，还是未来你的业务模型需求，都需要数据库来存储用户、订单、业务数据。
你可以按照你的业务需求，来选择你需要的数据库。目前最知名的主流关系型数据库主要有 PostgreSQL 和 MySQL。
其中我个人更推荐 PostgreSQL，因为 PostgreSQL 的生态更丰富，社区更活跃，文档更完善，功能更强大。无论你未来有什么需求，PostgreSQL 基本都能满足你。
虽然说 MySQL 作为一直很稳定的企业级数据库，但是随着 PostgreSQL 的生态越来越丰富，功能越来越强大，MySQL 已经逐渐被 PostgreSQL 取代。
举个例子来讲生态的好处，最近大多数 AI 业务可能都需要 RAG 的实现，而 RAG 又依赖向量数据库，像 PostgreSQL 有对应的 Vector 插件可以实现向量数据库功能，其它的数据库可能就无法实现。还有像其它的包括 Geo, 时间序列，全文搜索等等功能，PostgreSQL 都有对应的插件可以优化或者实现。
除此之外，你还可以根据你的业务需求来进行选择，除了搜索和实践序列这种专门的数据库类别，还可以选择像 SQLite 这样的轻量级数据库。
SQLite 可以满足大部分轻量级应用的需求，主要用于读密集型应用。因为 SQLite 的读取性能非常优秀，内存占用很低，可以放到距离用户更近的边缘服务器上，价格也相对便宜。
### [NextDevKit 默认集成数据库](https://nextdevkit.com/zh/docs/database#nextdevkit-%E9%BB%98%E8%AE%A4%E9%9B%86%E6%88%90%E6%95%B0%E6%8D%AE%E5%BA%93)
不同的 NextDevKit 默认集成了不同的数据库，例如 Next.js 模板默认集成了 PostgreSQL，而 Cloudflare workers 模板默认集成了 Cloudflare D1 数据库。而 SST AWS 模板默认集成了 AWS RDS + Proxy + PostgreSQL 数据库。
上面的默认集成选择是基于不同的模板所具备的特性决定的，你也可以根据你的业务需求进行选择替换，这在 NextDevKit 中非常简单。我们后面会详细介绍如何替换数据库。
对于不同数据库的云平台选择，我个人有以下的推荐：
  * 自托管数据库：可以通过 
  * PostgreSQL ：
  * MySQL ：
  * SQLite ：
  * 云平台数据库：AWS，Azure，Google Cloud SQL 是绝不会出错的选择。


## [什么是 ORM](https://nextdevkit.com/zh/docs/database#%E4%BB%80%E4%B9%88%E6%98%AF-orm)
在确认数据库后，我们接下来需要选择一个 ORM 来操作数据库。
ORM 是 Object-Relational Mapping 的缩写，它是一种编程技术，用于将数据库中的数据映射到对象中，从而使开发者可以像操作对象一样操作数据库中的数据。并且通过 ORM 可以方便的 migration 和回滚数据库的表结构。
主流的 ORM 选择有 Prisma，Drizzle，TypeORM 等。
NextDevKit 默认集成了 
选择 Drizzle 的原因主要有以下几点：
  * 支持多种数据库，包括 PostgreSQL，MySQL，SQLite 等，可以随意切换。
  * TypeScript 友好，支持 Zod 等库
  * Serverless 友好，支持 Edge，性能优秀


最后一点是 Serverless 友好是 Drizzle 击败 Prisma 作为 NextDevKit 默认 ORM 的重要原因。
## [定义表](https://nextdevkit.com/zh/docs/database#%E5%AE%9A%E4%B9%89%E8%A1%A8)
那么在 NextDevKit 中如何定义数据库表结构呢？
通过 Drizzle ORM 定义表结构非常简单，你只需要在 `src/database/schema.ts` 文件中定义你的表结构和字段和相关的索引即可。
src/database/schema.ts
```
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
export const user = pgTable(
	"user",
	{
		id: varchar("id", { length: 255 }).primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		customerId: text("customer_id"),
		role: text("role"),
		banned: boolean("banned"),
		banReason: text("ban_reason"),
		banExpires: timestamp("ban_expires"),
		locale: text("locale"),
	},
	(table) => {
		return {
			emailIdx: uniqueIndex("email_idx").on(table.email),
		};
	},
);
```

例如上面的代码定义了一个用户表，包含了用户的基本信息，如 id，name，email 等字段。还针对 email 字段创建了一个唯一索引。
NextDevKit 不同的模板的定义是不同的，例如上面的例子是 Next.js 模板，默认使用了 PostgreSQL 的 pgTable 来定义表结构，而 Cloudflare workers 模板默认集成了 Cloudflare D1 数据库，使用的是 SQLite 的 sqliteTable 来定义表结构。
如果你有切换的需求，例如在 cloudflare workers 模板，你不想使用 Cloudflare D1 数据库，而是像要使用 PostgreSQL 数据库，你只需要在 `src/database/schema.ts` 文件中修改对应的表结构定义即可。可以参考 Next.js 模板，也可以直接让 AI 来进行修改，准确率很高。
如上面的例子所示，你如果想要添加一个新的表，或者修改当前的表结构，你只需要在 `src/database/schema.ts` 文件中添加或者直接修改对应的表结构定义即可。
## [如何 migrate](https://nextdevkit.com/zh/docs/database#%E5%A6%82%E4%BD%95-migrate)
在定义完成表结构后，我们接下来需要进行 migrate 操作，将表结构同步到数据库中。
在 NextDevKit 中，我们使用 
DrizzleKit 是一个非常强大的工具，它可以帮助你自动生成数据库迁移文件，并且支持多种数据库。
在 NextDevKit 中，已经默认集成了 DrizzleKit 的命令，执行 `pnpm db:generate` 命令，DrizzleKit 会自动在根目录的 `drizzle` 生成数据库迁移文件，你可以查看 `drizzle` 目录下已经生成好的文件，这些文件包含了目前 NextDevKit 已有的表结构。
在生成好对应的表结构文件后，你只需要执行 `pnpm db:migrate` 命令，DrizzleKit 会自动执行数据库迁移文件，将表结构同步到数据库中。但在此之前，你需要在 `.env` 文件中配置好测试的数据库的连接信息。
  1. **生成迁移：** 此命令将您的架构文件与数据库状态进行比较，并在 `drizzle` 目录中创建新的 SQL 迁移文件。
```
pnpm db:generate
```

  2. **应用迁移：** 此命令执行迁移文件以更新您的数据库架构。
```
pnpm db:migrate
```



如果你想要通过 pipeline 来自动在部署的时候执行 migrate 操作，同步表修改到生产数据库中，你只需要在 pipeline 中添加对应的命令即可。例如在 Vercel 中加入对应的命令。
```
pnpm build && pnpm db:migrate
```

你也可以添加一个环境变量文件 `.env.production` 来存储生产环境的数据库连接信息，这样你就可以在本地执行 migrate 操作。
package.json
```
{
  "scripts": {
    "db:migrate:prod": "NODE_ENV=production drizzle-kit migrate"
  }
}
```

```
pnpm db:migrate:prod
```

NextDevKit 针对不同的模板有不同的优化，例如 Cloudflare workers 模板适合独立开发项目，大部分人都在本地部署，所以在 scripts 中已经默认集成了 `db:migrate:prod` 命令，大家可以自行探索。
### [migrate 数据](https://nextdevkit.com/zh/docs/database#migrate-%E6%95%B0%E6%8D%AE)
除了可以通过 migrate 命令来同步表结构到数据库中，你还可以通过相同的方式来同步数据到数据库中。
例如你有一些内置的数据需要同步到不同环境的数据库中，需要保持统一，你同样可以通过 `migrate` 命令来同步数据。
只需要你将数据通过 `insert` 的 SQL 语句写入到 `drizzle/xxx.sql` 文件中，DrizzleKit 会自动执行数据库迁移文件，将数据同步到数据库中。
drizzle/0001_seed-users.sql
```
INSERT INTO "users" ("name") VALUES('Dan');
INSERT INTO "users" ("name") VALUES('Andrew');
INSERT INTO "users" ("name") VALUES('Dandrew');
```

### [构建测试数据](https://nextdevkit.com/zh/docs/database#%E6%9E%84%E5%BB%BA%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE)
如果你需要在本地环境数据库构建一批测试数据，可以考虑使用 
## [如何使用 client](https://nextdevkit.com/zh/docs/database#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-client)
在定义好表结构并且 migrate 到数据库中后，我们接下来需要通过使用 client 来操作数据库。
NextDevKit 的不同模板的 client 处理有细微的区别，例如 Cloudflare workers 模板本地使用的 SQLite，它在本地并不需要 `DATABASE_URL` 环境变量，所以它的 client 有一些特殊的优化。
我们这里以 Next.js 模板为例，来介绍如何使用 client 来操作数据库。
在 `src/database/client.ts` 文件来定义 client。
src/database/client.ts
```
import { drizzle } from "drizzle-orm/node-postgres";
const databaseUrl = process.env.DATABASE_URL as string;
if (!databaseUrl) {
	throw new Error("Environment variable DATABASE_URL is not set");
}
export const db = drizzle(databaseUrl);
```

所有和数据库相关的操作，你都可以通过 `db` 对象来操作。例如你可以在 API 路由中使用 client 来操作数据库。
src/app/api/users/route.ts
```
import { db } from "@/database/client";
const user = await db.insert(user).values({
	name: "John Doe",
	email: "john.doe@example.com",
});
```

你同样也可以在服务端组件中使用 client 来操作数据库，也可以通过 server action 来操作数据库。
你可以参考 `src/lib/actions` 目录下的代码，来了解如何在 server action 中使用 client 来操作数据库。
## [如何本地开发连接数据库](https://nextdevkit.com/zh/docs/database#%E5%A6%82%E4%BD%95%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91%E8%BF%9E%E6%8E%A5%E6%95%B0%E6%8D%AE%E5%BA%93)
### [Next.js 模板](https://nextdevkit.com/zh/docs/database#nextjs-%E6%A8%A1%E6%9D%BF)
在 NextDevKit Next.js 模板中，我们默认使用 `DATABASE_URL` 环境变量来连接数据库，所以你只需要在 `.env` 文件中配置好对应的连接信息即可。
.env
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

这个数据库你可以使用本地的 Docker 来启动一个 PostgreSQL 数据库，也可以使用其它的云数据库实例，例如 Supabase，Neon 等。
配置完成后，你可以通过 `pnpm db:studio` 命令来打开本地连接的数据库的 studio 界面，来查看和操作数据库。
### [Cloudflare workers 模板](https://nextdevkit.com/zh/docs/database#cloudflare-workers-%E6%A8%A1%E6%9D%BF)
如果你使用的是 Cloudflare workers 模板，该模板在本地已经集成了 D1 数据库，你只需要执行：
```
# 创建本地 D1 数据库
npx wrangler d1 execute your-database-name --local --command='SELECT 1'
```

需要注意 `your-database-name` 需要与 wrangler.jsonc 中的 database_name 一致。
即可在本地启动一个 D1 数据库，并且执行 `SELECT 1` 命令来验证数据库是否正常工作。
启动后，你同样可以通过 `pnpm db:studio` 命令来打开数据库的 studio 界面，来查看和操作数据库。
### [SST AWS 模板](https://nextdevkit.com/zh/docs/database#sst-aws-%E6%A8%A1%E6%9D%BF)
如果你使用的是 SST AWS 模板，因为 SST 已经默认集成了 RDS 数据库，所以在本地的话，你只需要在 `.env` 文件中配置好本地环境对应的连接信息即可。
.env
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
```

不同模板的生产环境数据库连接信息，你可以在参考对应的模板数据库文档。
## [生产环境数据库的 studio](https://nextdevkit.com/zh/docs/database#%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E6%95%B0%E6%8D%AE%E5%BA%93%E7%9A%84-studio)
如果你想要在生产环境的数据库也使用 studio 来查看和操作数据库，你需要使用不同的方式。
如果你使用的是 Dokploy 来部署你的数据库，或者是云平台 Supabase，Neon，AWS RDS 等，除了通过他们的控制台来查看和操作数据外，现在还可以考虑使用 
如果你是使用 Cloudflare D1 数据库，你可以通过 drizzle chrome 扩展插件连接到数据库。
[构建 UI 组件 学习如何快速构建 NextDevKit 的 UI 组件，构建你的 SaaS 项目。](https://nextdevkit.com/zh/docs/build-ui-components)[PostgreSQL 数据库 NEXTDEVKIT 的完整 PostgreSQL 设置指南，包括云提供商和自托管选项。](https://nextdevkit.com/zh/docs/database/database-postgresql)
[](https://nextdevkit.com/zh/docs/database#%E9%80%89%E6%8B%A9%E4%BB%80%E4%B9%88%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/database#nextdevkit-%E9%BB%98%E8%AE%A4%E9%9B%86%E6%88%90%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/database#%E4%BB%80%E4%B9%88%E6%98%AF-orm)[](https://nextdevkit.com/zh/docs/database#%E5%AE%9A%E4%B9%89%E8%A1%A8)[](https://nextdevkit.com/zh/docs/database#%E5%A6%82%E4%BD%95-migrate)[](https://nextdevkit.com/zh/docs/database#migrate-%E6%95%B0%E6%8D%AE)[](https://nextdevkit.com/zh/docs/database#%E6%9E%84%E5%BB%BA%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE)[](https://nextdevkit.com/zh/docs/database#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-client)[](https://nextdevkit.com/zh/docs/database#%E5%A6%82%E4%BD%95%E6%9C%AC%E5%9C%B0%E5%BC%80%E5%8F%91%E8%BF%9E%E6%8E%A5%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/database#nextjs-%E6%A8%A1%E6%9D%BF)[](https://nextdevkit.com/zh/docs/database#cloudflare-workers-%E6%A8%A1%E6%9D%BF)[](https://nextdevkit.com/zh/docs/database#sst-aws-%E6%A8%A1%E6%9D%BF)[](https://nextdevkit.com/zh/docs/database#%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E6%95%B0%E6%8D%AE%E5%BA%93%E7%9A%84-studio)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
