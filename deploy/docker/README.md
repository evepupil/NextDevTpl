# Docker Compose 部署

Compose 包含 PostgreSQL、一次性迁移服务和应用服务。数据库目录使用
`postgres_data` named volume，不会写进项目目录。

1. 复制 `.env.example` 为 `.env.production`，至少设置
   `POSTGRES_PASSWORD`、`BETTER_AUTH_SECRET`、站点 URL 和所选适配器配置。
2. 首次生成的项目运行 `pnpm install && pnpm db:generate:init`，检查并提交
   `drizzle/`。后续 Schema 变化继续生成新的迁移。
3. 执行 `docker compose --env-file .env.production up -d --build`。
4. 执行 `pnpm deploy:check -- http://localhost:3000/api/health`。

`migrate` 成功退出后应用才会启动。升级时先备份 named volume 或外部数据库，
再构建新镜像；迁移失败会阻止新应用启动。
