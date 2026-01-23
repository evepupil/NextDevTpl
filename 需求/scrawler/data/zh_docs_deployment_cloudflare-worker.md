# 来源: https://nextdevkit.com/zh/docs/deployment/cloudflare-worker

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
[](https://nextdevkit.com/zh/docs/deployment)[](https://nextdevkit.com/zh/docs/deployment/vercel)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)[](https://nextdevkit.com/zh/docs/deployment/sst-aws)[](https://nextdevkit.com/zh/docs/deployment/container)
简体中文
Cloudflare Workers🎯 为什么选择 Cloudflare Workers
部署指南
# Cloudflare Workers
使用 OpenNext.js 将 NEXTDEVKIT 部署到 Cloudflare Workers 以获得全球边缘性能
将您的 NEXTDEVKIT 应用程序部署到 Cloudflare Workers，这是最具成本效益的全球边缘部署平台。Cloudflare Workers 提供卓越的性能，内置 CDN 和全球超低延迟。
## [🎯 为什么选择 Cloudflare Workers](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-cloudflare-workers)
  * **最具成本效益** ：按请求付费，极其实惠
  * **全球边缘网络** ：部署到全球 300+ 个位置，约 10ms 冷启动
  * **内置 CDN** ：包含全球内容分发网络
  * **零出站费用** ：出站流量无带宽费用
  * **慷慨的免费层** ：免费计划每天 100,000 个请求


## [📋 先决条件](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6)
在部署您的 NEXTDEVKIT 项目之前，确保您拥有：
  * **Cloudflare 账户** ：如果您没有账户，请
  * **Cloudflare Workers 标准计划（5 美元/月）** ：由于免费计划的 worker 大小限制为 3 MB，您需要升级到标准计划。
  * **环境变量** ：准备好生产环境变量（参见[环境指南](https://nextdevkit.com/docs/environment/cloudflare-worker)）


## [🚀 部署步骤](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)
### [第 1 步：配置环境变量](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-1-%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
请参考[环境指南](https://nextdevkit.com/docs/environment/cloudflare-worker)了解详细的环境变量。
复制 `.env.example` 到 `.env.production` 并更新环境变量。
### [第 2 步：配置 Wrangler 配置](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-2-%E6%AD%A5%E9%85%8D%E7%BD%AE-wrangler-%E9%85%8D%E7%BD%AE)
更新项目根目录中的 `wrangler.jsonc` 文件。
```
{
    "account_id": "your-account-id",
    "name": "your-worker-name",
}
```

如果您更改了 worker 名称，还需要更新 `wrangler.jsonc` 服务绑定到新的 worker 名称。
```
"services": [
    {
        "binding": "WORKER_SELF_REFERENCE",
        "service": "your-worker-name"
    }
]
```

### [第 3 步：配置 D1 数据库](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-3-%E6%AD%A5%E9%85%8D%E7%BD%AE-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)
在生产环境中为您的 NEXTDEVKIT 项目创建新的 D1 数据库：
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

### [第 4 步：创建 KV 命名空间](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-4-%E6%AD%A5%E5%88%9B%E5%BB%BA-kv-%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)
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

### [第 5 步：配置 wrangler.jsonc](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-5-%E6%AD%A5%E9%85%8D%E7%BD%AE-wranglerjsonc)
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

请不要更改 `d1_databases` 和 `kv_namespaces` 的默认绑定名称，如果您想将名称如 `NEXT_TAG_CACHE_D1` 更改为 `DB`，您需要更新代码以使用新名称。
src/database/client.ts
```
const { env } = await getCloudflareContext({ async: true });
if (!env.NEXT_TAG_CACHE_D1) {
  throw new Error("D1 database not found");
}
dbInstance = drizzle(env.NEXT_TAG_CACHE_D1, { schema, logger: true });
return dbInstance;
```

您需要在全局范围内搜索名称以找到绑定名称，并更新代码以使用新名称。
### [第 6 步：在本地环境中初始化 D1 数据库](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-6-%E6%AD%A5%E5%9C%A8%E6%9C%AC%E5%9C%B0%E7%8E%AF%E5%A2%83%E4%B8%AD%E5%88%9D%E5%A7%8B%E5%8C%96-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)
在本地开发环境中初始化 D1 数据库：
```
# 创建本地 D1 数据库
npx wrangler d1 execute your-database-name --local --command='SELECT 1'
```

需要注意 `your-database-name` 需要与 wrangler.jsonc 中的 database_name 一致。
> **参考** ：有关详细的数据库设置，请参见[数据库指南](https://nextdevkit.com/docs/database/database-cloudflare-d1)。
### [第 7 步：部署到 Cloudflare](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-7-%E6%AD%A5%E9%83%A8%E7%BD%B2%E5%88%B0-cloudflare)
```
pnpm install
# 登录到您的 Cloudflare 账户
pnpm wrangler login
# 检查您的账户 ID
pnpm wrangler whoami
# 构建项目
pnpm run build:prod
# 数据库迁移
pnpm run db:migrate:prod
# 部署到生产环境
pnpm run deploy
```

## [🌐 重要：域配置](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E9%87%8D%E8%A6%81%E5%9F%9F%E9%85%8D%E7%BD%AE)
### [场景 1：您已有域名（例如 workers.nextdevkit.com）](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%9C%BA%E6%99%AF-1%E6%82%A8%E5%B7%B2%E6%9C%89%E5%9F%9F%E5%90%8D%E4%BE%8B%E5%A6%82-workersnextdevkitcom)
如果您已拥有要使用的域名：
  1. **设置环境变量** 为您的最终域名：
```
BETTER_AUTH_URL="https://workers.nextdevkit.com"
NEXT_PUBLIC_APP_URL="https://workers.nextdevkit.com"
```

  2. **使用这些设置部署应用程序**
  3. **在 Cloudflare 仪表板中绑定您的域名** ：
     * 在 Cloudflare 仪表板中转到您的 worker
     * 导航到"Settings" → "Domains & Routes"
     * 在"Custom Domain"下添加您的自定义域名


### [场景 2：您还没有域名](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%9C%BA%E6%99%AF-2%E6%82%A8%E8%BF%98%E6%B2%A1%E6%9C%89%E5%9F%9F%E5%90%8D)
如果您没有域名并且想使用 Cloudflare 的自动生成域名：
  1. **使用占位符值** 进行初始部署：
```
BETTER_AUTH_URL="https://placeholder.workers.dev"
NEXT_PUBLIC_APP_URL="https://placeholder.workers.dev"
```

  2. **部署应用程序** - Cloudflare 将自动为您分配一个像 `your-worker-name.your-subdomain.workers.dev` 的域名
  3. **使用分配的域名更新环境变量** ：
```
BETTER_AUTH_URL="https://your-worker-name.your-subdomain.workers.dev"
NEXT_PUBLIC_APP_URL="https://your-worker-name.your-subdomain.workers.dev"
```

  4. **使用正确的域名重新部署应用程序**


> **⚠️ 重要** ：如果您配置了错误的域名，登录重定向将无法正常工作，因为身份验证系统需要正确的域名 URL。
## [🔧 数据库迁移](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)
### [运行迁移](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E8%BF%90%E8%A1%8C%E8%BF%81%E7%A7%BB)
```
# 生成迁移文件
pnpm run db:generate
# 将迁移应用到开发环境
pnpm run db:migrate:dev
# 将迁移应用到生产环境
pnpm run db:migrate:prod
```

### [在本地机器上运行 Drizzle Studio](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%9C%A8%E6%9C%AC%E5%9C%B0%E6%9C%BA%E5%99%A8%E4%B8%8A%E8%BF%90%E8%A1%8C-drizzle-studio)
```
npx wrangler d1 execute your-database-name --local --command='SELECT 1'
pnpm run db:studio
```

### [数据库管理](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%95%B0%E6%8D%AE%E5%BA%93%E7%AE%A1%E7%90%86)
```
# 清理 D1 缓存
pnpm run d1:cache:clean
# 管理 KV 存储
pnpm run list:kv
pnpm run delete:kv
```

## [已知问题](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%B7%B2%E7%9F%A5%E9%97%AE%E9%A2%98)
在本地环境中，运行 `pnpm dev` 会抛出以下错误：
```
✓ Compiled middleware in 256ms
▲ [WARNING]                             You have defined bindings to the following internal Durable Objects:
                                - {"name":"NEXT_CACHE_DO_QUEUE","class_name":"DOQueueHandler"}
                                These will not work in local development, but they should work in production.
                                If you want to develop these locally, you can define your DO in a separate Worker, with a
  separate configuration file.
                                For detailed instructions, refer to the Durable Objects section here:
  https://developers.cloudflare.com/workers/wrangler/api#supported-bindings
 ✓ Ready in 1478ms
▲ [WARNING]                             You have defined bindings to the following internal Durable Objects:
                                - {"name":"NEXT_CACHE_DO_QUEUE","class_name":"DOQueueHandler"}
                                These will not work in local development, but they should work in production.
                                If you want to develop these locally, you can define your DO in a separate Worker, with a
  separate configuration file.
                                For detailed instructions, refer to the Durable Objects section here:
  https://developers.cloudflare.com/workers/wrangler/api#supported-bindings
workerd/server/server.c++:1873: warning: A DurableObjectNamespace in the config referenced the class "DOQueueHandler", but no such Durable Object class is exported from the worker. Please make sure the class name matches, it is exported, and the class extends 'DurableObject'. Attempts to call to this Durable Object class will fail at runtime, but historically this was not a startup-time error. Future versions of workerd may make this a startup-time error.
workerd/server/server.c++:1873: warning: A DurableObjectNamespace in the config referenced the class "DOQueueHandler", but no such Durable Object class is exported from the worker. Please make sure the class name matches, it is exported, and the class extends 'DurableObject'. Attempts to call to this Durable Object class will fail at runtime, but historically this was not a startup-time error. Future versions of workerd may make this a startup-time error.
```

这个问题是 OpenNext 的已知问题，您可以关注 
此警告可以安全忽略，因为缓存 Durable Objects 在构建期间不会使用。
## [📊 分析](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E5%88%86%E6%9E%90)
  * 在 Cloudflare 仪表板中监控性能
  * 跟踪请求模式和错误
  * 查看全球流量分布
  * 监控数据库性能


## [🚨 常见问题和解决方案](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E5%92%8C%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
### [构建失败](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%9E%84%E5%BB%BA%E5%A4%B1%E8%B4%A5)
**问题** ：部署期间构建过程失败
**解决方案** ：
  * 确保 Node.js 版本是 20+
  * 检查所有依赖项都已安装
  * 验证 `wrangler.jsonc` 配置
  * 清除构建缓存：`rm -rf .next .open-next`


### [数据库连接问题](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5%E9%97%AE%E9%A2%98)
**问题** ：无法连接到 D1 数据库
**解决方案** ：
  * 验证 `wrangler.jsonc` 中的数据库 ID
  * 检查绑定名称是否与代码使用匹配
  * 确保已应用迁移


**参考** ：有关数据库故障排除，请参见[数据库指南](https://nextdevkit.com/docs/database/database-cloudflare-d1)。
### [环境变量问题](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E9%97%AE%E9%A2%98)
**问题** ：环境变量不工作
**解决方案** ：
  * 对敏感值使用 `wrangler secret put`
  * 检查变量名称是否正确
  * 验证本地开发的 `.dev.vars`
  * 确保客户端变量使用 `NEXT_PUBLIC_` 前缀


### [性能问题](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%80%A7%E8%83%BD%E9%97%AE%E9%A2%98)
**问题** ：响应时间慢
**解决方案** ：
  * 在 `wrangler.jsonc` 中启用智能放置
  * 实施适当的缓存策略
  * 优化包大小
  * 对频繁访问的数据使用 KV


## [🎉 下一步](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
成功部署后：
  1. **测试您的应用程序** ：验证所有功能工作正常
  2. **设置监控** ：配置错误跟踪和分析
  3. **配置自定义域名** ：设置您自己的域名
  4. **优化性能** ：实施缓存和优化策略
  5. **扩展资源** ：随着应用程序增长而升级


## [🔗 有用资源](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E6%9C%89%E7%94%A8%E8%B5%84%E6%BA%90)
  * [环境变量指南](https://nextdevkit.com/docs/environment/cloudflare-worker)
  * [数据库配置指南](https://nextdevkit.com/docs/database/database-cloudflare-d1)


准备将您的 NEXTDEVKIT 应用程序部署到 Cloudflare Workers 了吗？按照上述步骤体验全球边缘计算的力量！🌍⚡
[Vercel 零配置将 NEXTDEVKIT 部署到 Vercel](https://nextdevkit.com/zh/docs/deployment/vercel)[AWS SST 使用 Serverless Stack (SST) 和基础设施即代码将 NEXTDEVKIT 部署到 AWS](https://nextdevkit.com/zh/docs/deployment/sst-aws)
[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-cloudflare-workers)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-1-%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-2-%E6%AD%A5%E9%85%8D%E7%BD%AE-wrangler-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-3-%E6%AD%A5%E9%85%8D%E7%BD%AE-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-4-%E6%AD%A5%E5%88%9B%E5%BB%BA-kv-%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-5-%E6%AD%A5%E9%85%8D%E7%BD%AE-wranglerjsonc)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-6-%E6%AD%A5%E5%9C%A8%E6%9C%AC%E5%9C%B0%E7%8E%AF%E5%A2%83%E4%B8%AD%E5%88%9D%E5%A7%8B%E5%8C%96-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%AC%AC-7-%E6%AD%A5%E9%83%A8%E7%BD%B2%E5%88%B0-cloudflare)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E9%87%8D%E8%A6%81%E5%9F%9F%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%9C%BA%E6%99%AF-1%E6%82%A8%E5%B7%B2%E6%9C%89%E5%9F%9F%E5%90%8D%E4%BE%8B%E5%A6%82-workersnextdevkitcom)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%9C%BA%E6%99%AF-2%E6%82%A8%E8%BF%98%E6%B2%A1%E6%9C%89%E5%9F%9F%E5%90%8D)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E8%BF%90%E8%A1%8C%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%9C%A8%E6%9C%AC%E5%9C%B0%E6%9C%BA%E5%99%A8%E4%B8%8A%E8%BF%90%E8%A1%8C-drizzle-studio)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%95%B0%E6%8D%AE%E5%BA%93%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E5%B7%B2%E7%9F%A5%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E5%88%86%E6%9E%90)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E5%92%8C%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%9E%84%E5%BB%BA%E5%A4%B1%E8%B4%A5)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#%E6%80%A7%E8%83%BD%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E4%B8%8B%E4%B8%80%E6%AD%A5)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker#-%E6%9C%89%E7%94%A8%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
