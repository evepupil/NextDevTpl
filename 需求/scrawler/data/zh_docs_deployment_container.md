# 来源: https://nextdevkit.com/zh/docs/deployment/container

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
[](https://nextdevkit.com/zh/docs/deployment)[](https://nextdevkit.com/zh/docs/deployment/vercel)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)[](https://nextdevkit.com/zh/docs/deployment/sst-aws)[](https://nextdevkit.com/zh/docs/deployment/container)
简体中文
容器部署🌟 为什么选择容器部署？
部署指南
# 容器部署
使用 Docker 容器将 NEXTDEVKIT 部署到各种云平台
使用 Docker 容器将您的 NEXTDEVKIT 应用程序部署到各种云平台，获得最大的灵活性和控制力。
## [🌟 为什么选择容器部署？](https://nextdevkit.com/zh/docs/deployment/container#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9%E5%AE%B9%E5%99%A8%E9%83%A8%E7%BD%B2)
容器部署非常适合需要以下特性的应用程序：
  * **🔧 完全控制** ：对运行时环境和依赖项的完全控制
  * **🌐 平台灵活性** ：可部署到任何云提供商或本地环境
  * **📦 一致环境** ：开发、测试和生产环境保持一致
  * **🔄 易于扩展** ：通过编排平台实现水平扩展
  * **🛡️ 隔离性** ：进程和资源隔离以确保安全性
  * **⚡ 快速部署** ：快速推出和回滚


## [🚀 部署步骤](https://nextdevkit.com/zh/docs/deployment/container#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)
### [步骤 1：配置环境变量](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-1%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
请参考 [环境设置指南](https://nextdevkit.com/docs/environment) 了解详细的环境变量配置。
将 `.env.example` 复制为 `.env.production` 或 `.env` 并更新环境变量。
### [步骤 2：使用 Dockerfile](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-2%E4%BD%BF%E7%94%A8-dockerfile)
使用项目根目录中的 `Dockerfile`：
```
# 使用官方 Node.js 运行时作为基础镜像
FROM node:20-alpine AS base
# 仅在需要时安装依赖项
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# 根据首选包管理器安装依赖项
COPY package.json pnpm-lock.yaml* ./
COPY source.config.ts ./
COPY src/content ./src/content
RUN corepack enable pnpm && pnpm i --frozen-lockfile
# 仅在需要时重新构建源代码
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 构建应用程序
RUN corepack enable pnpm && pnpm run build
# 生产镜像，复制所有文件并运行 next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# 复制构建的应用程序
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
# 启动应用程序
CMD ["node", "server.js"]
```

更新 `next.config.ts` 文件以启用独立输出：
```
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
};
export default nextConfig;
```

### [步骤 3：本地构建和测试](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-3%E6%9C%AC%E5%9C%B0%E6%9E%84%E5%BB%BA%E5%92%8C%E6%B5%8B%E8%AF%95)
```
# 构建 Docker 镜像
docker build -t nextdevkit:latest .
# 本地运行容器
docker run -p 3000:3000 --env-file .env nextdevkit:latest
```

### [步骤 4：部署到云平台](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-4%E9%83%A8%E7%BD%B2%E5%88%B0%E4%BA%91%E5%B9%B3%E5%8F%B0)
选择您首选的云平台：
#### [推荐平台](https://nextdevkit.com/zh/docs/deployment/container#%E6%8E%A8%E8%8D%90%E5%B9%B3%E5%8F%B0)
对于通用容器部署，NEXTDEVKIT 支持所有主要的云提供商：
平台 | 类型 | 网站  
---|---|---  
**Azure Container Apps** | 微软云 |   
**Google Cloud Run** | 谷歌云 |   
**Railway** | 开发者友好 |   
**Fly.io** | 全球边缘容器 |   
**Dokploy** | 自托管 |   
**Coolify** | 自托管 |   
您的 NEXTDEVKIT 应用程序现在已容器化并准备好进行部署！🐳🚀
[AWS SST 使用 Serverless Stack (SST) 和基础设施即代码将 NEXTDEVKIT 部署到 AWS](https://nextdevkit.com/zh/docs/deployment/sst-aws)
[](https://nextdevkit.com/zh/docs/deployment/container#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9%E5%AE%B9%E5%99%A8%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/container#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-1%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-2%E4%BD%BF%E7%94%A8-dockerfile)[](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-3%E6%9C%AC%E5%9C%B0%E6%9E%84%E5%BB%BA%E5%92%8C%E6%B5%8B%E8%AF%95)[](https://nextdevkit.com/zh/docs/deployment/container#%E6%AD%A5%E9%AA%A4-4%E9%83%A8%E7%BD%B2%E5%88%B0%E4%BA%91%E5%B9%B3%E5%8F%B0)[](https://nextdevkit.com/zh/docs/deployment/container#%E6%8E%A8%E8%8D%90%E5%B9%B3%E5%8F%B0)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
