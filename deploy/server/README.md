# 服务器部署

要求 Node.js 24、pnpm 10、PostgreSQL 和 systemd。数据库连接建议使用独立托管
实例；应用服务器只保存可替换的 standalone 产物。

## 首次部署

1. 复制 `.env.example` 为 `.env.production`，填写真实生产配置。不要把这个文件
   加入 Git 或构建包。
2. 首次生成的项目先运行 `pnpm install && pnpm db:generate:init`，检查生成的 SQL
   并提交 `drizzle/`。仓库已经带迁移时跳过这一步。
3. 加载生产环境变量后运行 `pnpm deploy:server:build`。脚本先执行已提交迁移，
   再把 standalone 产物写入 `.release/`。
4. 把 `.release/` 上传到 `/opt/nextdevtpl/current`，把环境文件单独放到
   `/opt/nextdevtpl/shared/.env.production`。
5. 按实际用户和目录调整 `nextdevtpl.service`，安装到 systemd 后启动服务。

反向代理应终止 TLS，并把原始协议和主机头转发给端口 3000。发布完成后执行：

```bash
pnpm deploy:check -- https://your-domain.example/api/health
```

接口返回 200 且 `status` 为 `healthy` 才表示配置和数据库均已就绪。
