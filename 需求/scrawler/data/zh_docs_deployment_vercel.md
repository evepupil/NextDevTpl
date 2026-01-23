# 来源: https://nextdevkit.com/zh/docs/deployment/vercel

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
[](https://nextdevkit.com/zh/docs/deployment)[](https://nextdevkit.com/zh/docs/deployment/vercel)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)[](https://nextdevkit.com/zh/docs/deployment/sst-aws)[](https://nextdevkit.com/zh/docs/deployment/container)
简体中文
Vercel🎯 为什么选择 Vercel
部署指南
# Vercel
零配置将 NEXTDEVKIT 部署到 Vercel
将您的 NEXTDEVKIT 应用程序部署到 Vercel，这是 Next.js 应用程序最通用的平台。Vercel 提供与 Next.js 的无缝集成，并提供零配置部署的优秀开发者体验。
## [🎯 为什么选择 Vercel](https://nextdevkit.com/zh/docs/deployment/vercel#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-vercel)
  * **零配置** ：专为 Next.js 应用程序构建
  * **全球边缘网络** ：全球自动边缘部署
  * **预览部署** ：每个拉取请求的唯一 URL
  * **自动优化** ：内置性能优化
  * **慷慨的免费层** ：适合开发和小型项目


## [📋 先决条件](https://nextdevkit.com/zh/docs/deployment/vercel#-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6)
在部署您的 NEXTDEVKIT 项目之前，确保您拥有：
  * **Git 仓库** ：您的代码已推送到 GitHub、GitLab 或 Bitbucket
  * **Vercel 账户** ：如果您没有账户，请
  * **数据库设置** ：已配置外部数据库（参见[数据库指南](https://nextdevkit.com/docs/database)）
  * **环境变量** ：准备好生产环境变量（参见[环境指南](https://nextdevkit.com/docs/environment)）


## [🚀 部署步骤](https://nextdevkit.com/zh/docs/deployment/vercel#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)
### [第 1 步：将代码推送到 Git 仓库](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-1-%E6%AD%A5%E5%B0%86%E4%BB%A3%E7%A0%81%E6%8E%A8%E9%80%81%E5%88%B0-git-%E4%BB%93%E5%BA%93)
确保您的 NEXTDEVKIT 代码已推送到您的 Git 仓库，如 GitHub、GitLab 或 Bitbucket。
### [第 2 步：连接到 Vercel](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-2-%E6%AD%A5%E8%BF%9E%E6%8E%A5%E5%88%B0-vercel)
  1. 登录 
  2. 点击 **"Add New Project"** 或 **"New Project"** 按钮
  3. 从 GitHub、GitLab 或 Bitbucket 导入您的 Git 仓库
  4. 选择您的 NEXTDEVKIT 仓库


### [第 3 步：配置项目设置](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-3-%E6%AD%A5%E9%85%8D%E7%BD%AE%E9%A1%B9%E7%9B%AE%E8%AE%BE%E7%BD%AE)
在配置页面上，Vercel 将自动检测您的 Next.js 项目。验证这些设置：
设置 | 值 | 注释  
---|---|---  
**框架预设** | Next.js | 自动检测  
**构建命令** | `pnpm run build` | 推荐  
**输出目录** | `.next` | 默认  
**安装命令** | `pnpm install` | 推荐  
**Node.js 版本** | 20.x 或 22.x | 推荐  
> **注意** ：除非您有特定要求，否则保持默认值。Vercel 为 Next.js 应用程序优化了这些设置。
### [第 4 步：配置环境变量](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-4-%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
在 **环境变量** 部分，为您的 NEXTDEVKIT 应用程序添加所有必需的变量：
> **参考** ：有关详细的环境变量配置，请参见[环境指南](https://nextdevkit.com/docs/environment)。
### [第 5 步：部署项目](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-5-%E6%AD%A5%E9%83%A8%E7%BD%B2%E9%A1%B9%E7%9B%AE)
  1. 点击 **"Deploy"** 按钮开始部署过程
  2. Vercel 将自动构建和部署您的项目
  3. 等待部署完成（通常 1-2 分钟）
  4. 您的应用程序将在 `https://your-project.vercel.app` 可用


## [🌐 重要：NEXT_PUBLIC_APP_URL 配置](https://nextdevkit.com/zh/docs/deployment/vercel#-%E9%87%8D%E8%A6%81next_public_app_url-%E9%85%8D%E7%BD%AE)
`NEXT_PUBLIC_APP_URL` 环境变量对于您的应用程序正常工作至关重要。
### [初始部署](https://nextdevkit.com/zh/docs/deployment/vercel#%E5%88%9D%E5%A7%8B%E9%83%A8%E7%BD%B2)
对于您的首次部署，使用 Vercel 提供的域名：
```
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
```

### [部署后](https://nextdevkit.com/zh/docs/deployment/vercel#%E9%83%A8%E7%BD%B2%E5%90%8E)
  1. 在成功部署后记录 Vercel 提供的域名
  2. 使用此域名更新 `NEXT_PUBLIC_APP_URL` 环境变量
  3. 重新部署项目以应用更改


### [使用自定义域名](https://nextdevkit.com/zh/docs/deployment/vercel#%E4%BD%BF%E7%94%A8%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9F%9F%E5%90%8D)
如果您计划使用自定义域名：
```
NEXT_PUBLIC_APP_URL="https://your-custom-domain.com"
```

## [🔧 自定义域名设置](https://nextdevkit.com/zh/docs/deployment/vercel#-%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9F%9F%E5%90%8D%E8%AE%BE%E7%BD%AE)
要为您的 NEXTDEVKIT 项目添加自定义域名：
### [第 1 步：在 Vercel 中添加域名](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-1-%E6%AD%A5%E5%9C%A8-vercel-%E4%B8%AD%E6%B7%BB%E5%8A%A0%E5%9F%9F%E5%90%8D)
  1. 在 Vercel 控制台中转到您的项目
  2. 导航到 **Settings** → **Domains**
  3. 点击 **"Add Domain"**
  4. 输入您的自定义域名（例如，`your-app.com`）


### [第 2 步：配置 DNS](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-2-%E6%AD%A5%E9%85%8D%E7%BD%AE-dns)
按照 Vercel 的 DNS 配置说明：
  * **对于 Vercel 名称服务器** ：更改您域名的名称服务器
  * **对于外部 DNS** ：按指示添加 A/CNAME 记录


### [第 3 步：更新环境变量](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-3-%E6%AD%A5%E6%9B%B4%E6%96%B0%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
  1. 转到 **Settings** → **Environment Variables**
  2. 将 `NEXT_PUBLIC_APP_URL` 更新为您的自定义域名
  3. 将 `BETTER_AUTH_URL` 更新为您的自定义域名
  4. 重新部署项目


## [⚙️ 管理环境变量](https://nextdevkit.com/zh/docs/deployment/vercel#%EF%B8%8F-%E7%AE%A1%E7%90%86%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
### [添加新变量](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%B7%BB%E5%8A%A0%E6%96%B0%E5%8F%98%E9%87%8F)
  1. 转到 **Project Settings** → **Environment Variables**
  2. 点击 **"Add New"**
  3. 输入变量名和值
  4. 选择环境（生产、预览、开发）
  5. 点击 **"Save"**


### [更新变量](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%9B%B4%E6%96%B0%E5%8F%98%E9%87%8F)
  1. 在列表中找到变量
  2. 点击 **"Edit"**
  3. 更新值
  4. 点击 **"Save"**
  5. **重新部署** 项目以应用更改


### [环境类型](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%8E%AF%E5%A2%83%E7%B1%BB%E5%9E%8B)
  * **生产** ：实时应用程序
  * **预览** ：拉取请求部署
  * **开发** ：本地开发（可选）


## [🔄 自动部署](https://nextdevkit.com/zh/docs/deployment/vercel#-%E8%87%AA%E5%8A%A8%E9%83%A8%E7%BD%B2)
Vercel 为以下提供自动部署：
### [生产部署](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%94%9F%E4%BA%A7%E9%83%A8%E7%BD%B2)
  * **触发** ：推送到 main/master 分支
  * **URL** ：您的生产域名
  * **环境** ：生产变量


### [预览部署](https://nextdevkit.com/zh/docs/deployment/vercel#%E9%A2%84%E8%A7%88%E9%83%A8%E7%BD%B2)
  * **触发** ：拉取请求和功能分支
  * **URL** ：每个部署的唯一预览 URL
  * **环境** ：预览变量（回退到生产）


### [分支部署](https://nextdevkit.com/zh/docs/deployment/vercel#%E5%88%86%E6%94%AF%E9%83%A8%E7%BD%B2)
  * **触发** ：推送到任何分支（可配置）
  * **URL** ：分支特定 URL
  * **环境** ：预览变量


## [📊 Vercel 对 NEXTDEVKIT 的优化](https://nextdevkit.com/zh/docs/deployment/vercel#-vercel-%E5%AF%B9-nextdevkit-%E7%9A%84%E4%BC%98%E5%8C%96)
### [自动优化](https://nextdevkit.com/zh/docs/deployment/vercel#%E8%87%AA%E5%8A%A8%E4%BC%98%E5%8C%96)
Vercel 自动应用这些优化：
  * **图像优化** ：自动 WebP/AVIF 转换
  * **代码分割** ：自动包优化
  * **边缘缓存** ：静态资源全球缓存
  * **压缩** ：Gzip/Brotli 压缩


## [🔍 监控和调试](https://nextdevkit.com/zh/docs/deployment/vercel#-%E7%9B%91%E6%8E%A7%E5%92%8C%E8%B0%83%E8%AF%95)
### [构建日志](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%9E%84%E5%BB%BA%E6%97%A5%E5%BF%97)
  * 在 Vercel 仪表板中访问构建日志
  * 检查构建错误和警告
  * 监控构建性能


### [运行时日志](https://nextdevkit.com/zh/docs/deployment/vercel#%E8%BF%90%E8%A1%8C%E6%97%B6%E6%97%A5%E5%BF%97)
  * 实时查看函数日志
  * 监控 API 路由性能
  * 跟踪错误和异常


### [分析](https://nextdevkit.com/zh/docs/deployment/vercel#%E5%88%86%E6%9E%90)
  * 启用 Vercel Analytics 以获得性能洞察
  * 监控核心 Web 重要指标
  * 跟踪用户交互


## [🚨 常见问题和解决方案](https://nextdevkit.com/zh/docs/deployment/vercel#-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E5%92%8C%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
### [构建失败](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%9E%84%E5%BB%BA%E5%A4%B1%E8%B4%A5)
**问题** ：部署期间构建过程失败
**解决方案** ：
  * 查看构建日志以获得详细错误信息
  * 确保所有依赖项都在 `package.json` 中
  * 验证环境变量设置正确
  * 检查 TypeScript 错误


### [身份验证问题](https://nextdevkit.com/zh/docs/deployment/vercel#%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81%E9%97%AE%E9%A2%98)
**问题** ：部署后身份验证不工作
**解决方案** ：
  * 验证 `BETTER_AUTH_URL` 与您的域名匹配
  * 检查 `BETTER_AUTH_SECRET` 设置正确
  * 确保回调 URL 配置正确
  * 验证数据库连接


### [数据库连接问题](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5%E9%97%AE%E9%A2%98)
**问题** ：无法连接到数据库
**解决方案** ：
  * 验证 `DATABASE_URL` 是否正确
  * 检查数据库服务是否运行
  * 确保数据库允许来自 Vercel 的连接
  * 首先在本地测试连接


**参考** ：有关数据库设置，请参见[数据库指南](https://nextdevkit.com/docs/database)。
### [环境变量问题](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E9%97%AE%E9%A2%98)
**问题** ：环境变量不工作
**解决方案** ：
  * 确保为生产环境设置变量
  * 检查变量名是否正确（区分大小写）
  * 更改变量后重新部署
  * 验证客户端变量的 `NEXT_PUBLIC_` 前缀


## [🎉 下一步](https://nextdevkit.com/zh/docs/deployment/vercel#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
成功部署后：
  1. **测试您的应用程序** ：验证所有功能工作正常
  2. **设置监控** ：配置错误跟踪和分析
  3. **配置 Webhooks** ：如果使用支付，设置 Stripe webhooks
  4. **SSL 证书** ：Vercel 提供自动 SSL 证书
  5. **性能监控** ：使用 Vercel Analytics 获得洞察


## [🔗 有用资源](https://nextdevkit.com/zh/docs/deployment/vercel#-%E6%9C%89%E7%94%A8%E8%B5%84%E6%BA%90)
  * [环境变量指南](https://nextdevkit.com/docs/environment)
  * [数据库配置指南](https://nextdevkit.com/docs/database)


准备将您的 NEXTDEVKIT 应用程序部署到 Vercel 了吗？按照上述步骤，您的应用程序将在几分钟内上线！🚀
[概述 为您的 NEXTDEVKIT 应用程序选择合适的部署平台](https://nextdevkit.com/zh/docs/deployment)[Cloudflare Workers 使用 OpenNext.js 将 NEXTDEVKIT 部署到 Cloudflare Workers 以获得全球边缘性能](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)
[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-vercel)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-1-%E6%AD%A5%E5%B0%86%E4%BB%A3%E7%A0%81%E6%8E%A8%E9%80%81%E5%88%B0-git-%E4%BB%93%E5%BA%93)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-2-%E6%AD%A5%E8%BF%9E%E6%8E%A5%E5%88%B0-vercel)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-3-%E6%AD%A5%E9%85%8D%E7%BD%AE%E9%A1%B9%E7%9B%AE%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-4-%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-5-%E6%AD%A5%E9%83%A8%E7%BD%B2%E9%A1%B9%E7%9B%AE)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E9%87%8D%E8%A6%81next_public_app_url-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E5%88%9D%E5%A7%8B%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E9%83%A8%E7%BD%B2%E5%90%8E)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E4%BD%BF%E7%94%A8%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9F%9F%E5%90%8D)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9F%9F%E5%90%8D%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-1-%E6%AD%A5%E5%9C%A8-vercel-%E4%B8%AD%E6%B7%BB%E5%8A%A0%E5%9F%9F%E5%90%8D)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-2-%E6%AD%A5%E9%85%8D%E7%BD%AE-dns)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%AC%AC-3-%E6%AD%A5%E6%9B%B4%E6%96%B0%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/vercel#%EF%B8%8F-%E7%AE%A1%E7%90%86%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%B7%BB%E5%8A%A0%E6%96%B0%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%9B%B4%E6%96%B0%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%8E%AF%E5%A2%83%E7%B1%BB%E5%9E%8B)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E8%87%AA%E5%8A%A8%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%94%9F%E4%BA%A7%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E9%A2%84%E8%A7%88%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E5%88%86%E6%94%AF%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/vercel#-vercel-%E5%AF%B9-nextdevkit-%E7%9A%84%E4%BC%98%E5%8C%96)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E8%87%AA%E5%8A%A8%E4%BC%98%E5%8C%96)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E7%9B%91%E6%8E%A7%E5%92%8C%E8%B0%83%E8%AF%95)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%9E%84%E5%BB%BA%E6%97%A5%E5%BF%97)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E8%BF%90%E8%A1%8C%E6%97%B6%E6%97%A5%E5%BF%97)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E5%88%86%E6%9E%90)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E5%92%8C%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%9E%84%E5%BB%BA%E5%A4%B1%E8%B4%A5)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/vercel#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E4%B8%8B%E4%B8%80%E6%AD%A5)[](https://nextdevkit.com/zh/docs/deployment/vercel#-%E6%9C%89%E7%94%A8%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
