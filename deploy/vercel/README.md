# Vercel 部署

Vercel 预设使用 Node.js Serverless 运行时。推荐使用 Neon PostgreSQL、S3 兼容
对象存储、Upstash Redis 和 Inngest；实际启用项以生成器选择的适配器为准。

1. 在 Vercel 项目中配置 `.env.example` 列出的变量，并把
   `NEXT_PUBLIC_APP_URL`、`BETTER_AUTH_URL` 设置为正式域名。
2. 首次生成的项目运行 `pnpm install && pnpm db:generate:init`，检查并提交
   `drizzle/`。
3. 在发布前的单实例任务或本机受控环境运行 `pnpm db:migrate`。不要把迁移放进
   Vercel `buildCommand`，多个构建实例可能并发执行。
4. 发布后执行
   `pnpm deploy:check -- https://your-project.vercel.app/api/health`。

`vercel.json` 只声明框架、构建命令和已选模块需要的 Cron。OAuth 回调、支付
Webhook、Inngest 回调和对象存储 CORS 仍需在各服务后台配置正式域名。
