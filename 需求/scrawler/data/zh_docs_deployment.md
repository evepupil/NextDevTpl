# 来源: https://nextdevkit.com/zh/docs/deployment

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
[](https://nextdevkit.com/zh/docs/deployment)[](https://nextdevkit.com/zh/docs/deployment/vercel)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)[](https://nextdevkit.com/zh/docs/deployment/sst-aws)[](https://nextdevkit.com/zh/docs/deployment/container)
简体中文
概述🌐 原生支持的平台
部署指南
# 概述
为您的 NEXTDEVKIT 应用程序选择合适的部署平台
NEXTDEVKIT 设计为部署无关，提供在多个平台上部署的灵活性。本指南涵盖支持的部署选项，包含逐步说明。
## [🌐 原生支持的平台](https://nextdevkit.com/zh/docs/deployment#-%E5%8E%9F%E7%94%9F%E6%94%AF%E6%8C%81%E7%9A%84%E5%B9%B3%E5%8F%B0)
### [主要平台](https://nextdevkit.com/zh/docs/deployment#%E4%B8%BB%E8%A6%81%E5%B9%B3%E5%8F%B0)
平台 | 最适合 | 定价 | 网站  
---|---|---|---  
**Vercel** | 🎯 最通用 - 零配置的生产应用 | 免费层 + 按使用付费 |   
**Cloudflare** | 💰 最具成本效益 - 全球边缘部署 | 极其实惠 |   
**AWS** | 🏢 最合规 - 企业级安全 | 按使用付费 |   
### [AWS 部署选项](https://nextdevkit.com/zh/docs/deployment#aws-%E9%83%A8%E7%BD%B2%E9%80%89%E9%A1%B9)
部署类型 | 用例 | 扩展  
---|---|---  
**无服务器** | 🔄 自动扩展应用程序 | Lambda + CloudFront  
**ECS** | 🐳 基于容器的部署 | 托管容器编排  
## [🐳 容器化部署](https://nextdevkit.com/zh/docs/deployment#-%E5%AE%B9%E5%99%A8%E5%8C%96%E9%83%A8%E7%BD%B2)
对于通用容器部署，NEXTDEVKIT 支持所有主要云提供商：
平台 | 类型 | 网站  
---|---|---  
**Azure Container Apps** | Microsoft 云 |   
**Google Cloud Run** | Google 云 |   
**Railway** | 开发者友好 |   
**Fly.io** | 全球边缘容器 |   
**Dokploy** | 自托管 |   
**Coolify** | 自托管 |   
## [💰 Cloudflare - 最具成本效益](https://nextdevkit.com/zh/docs/deployment#-cloudflare---%E6%9C%80%E5%85%B7%E6%88%90%E6%9C%AC%E6%95%88%E7%9B%8A)
Cloudflare 提供最佳的性价比和全球边缘部署。
### [关键功能](https://nextdevkit.com/zh/docs/deployment#%E5%85%B3%E9%94%AE%E5%8A%9F%E8%83%BD)
  * **边缘运行时** ：全球分发，约 10ms 冷启动
  * **R2 存储** ：S3 兼容的对象存储，成本更低
  * **KV 存储** ：用于缓存的超快键值存储
  * **内置 CDN** ：包含全球内容分发网络


### [成本优势](https://nextdevkit.com/zh/docs/deployment#%E6%88%90%E6%9C%AC%E4%BC%98%E5%8A%BF)
  * **免费层** ：每天 100,000 个请求
  * **付费计划** ：每月 5 美元可处理 1000 万个请求
  * **存储** ：R2 比 S3 便宜 10 倍
  * **带宽** ：无出站费用


## [🏢 AWS - 最合规](https://nextdevkit.com/zh/docs/deployment#-aws---%E6%9C%80%E5%90%88%E8%A7%84)
AWS 提供企业级安全、合规和可扩展性选项。
### [合规功能](https://nextdevkit.com/zh/docs/deployment#%E5%90%88%E8%A7%84%E5%8A%9F%E8%83%BD)
  * **SOC 2 Type II** ：安全合规
  * **HIPAA** ：医疗数据保护
  * **GDPR** ：欧洲数据保护
  * **PCI DSS** ：支付卡行业合规


### [部署选项](https://nextdevkit.com/zh/docs/deployment#%E9%83%A8%E7%BD%B2%E9%80%89%E9%A1%B9)
#### [1. 无服务器部署](https://nextdevkit.com/zh/docs/deployment#1-%E6%97%A0%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%83%A8%E7%BD%B2)
最适合具有可变流量的自动扩展应用程序：
**使用的服务：**
  * Lambda 用于无服务器函数
  * CloudWatch 用于监控
  * CloudFront 用于 CDN
  * RDS 用于数据库


#### [2. ECS 部署](https://nextdevkit.com/zh/docs/deployment#2-ecs-%E9%83%A8%E7%BD%B2)
最适合一致的工作负载和完全的容器控制：
**使用的服务：**
  * ECS 用于容器编排
  * Fargate 用于无服务器容器
  * Application Load Balancer
  * RDS 用于数据库


## [🎯 平台比较](https://nextdevkit.com/zh/docs/deployment#-%E5%B9%B3%E5%8F%B0%E6%AF%94%E8%BE%83)
### [何时选择 Vercel](https://nextdevkit.com/zh/docs/deployment#%E4%BD%95%E6%97%B6%E9%80%89%E6%8B%A9-vercel)
  * **快速原型制作** ：零配置部署
  * **Next.js 优化** ：专为 Next.js 构建
  * **GitHub 集成** ：从 Git 自动部署
  * **开发者体验** ：出色的 DX 和预览部署


### [何时选择 Cloudflare](https://nextdevkit.com/zh/docs/deployment#%E4%BD%95%E6%97%B6%E9%80%89%E6%8B%A9-cloudflare)
  * **成本优化** ：最低运营成本
  * **全球性能** ：全球边缘部署
  * **高流量** ：非常适合流量峰值
  * **静态重载站点** ：适合内容丰富的应用程序


### [何时选择 AWS](https://nextdevkit.com/zh/docs/deployment#%E4%BD%95%E6%97%B6%E9%80%89%E6%8B%A9-aws)
  * **企业要求** ：合规和安全需求
  * **自定义基础设施** ：对基础设施的完全控制
  * **混合部署** ：无服务器和容器的混合
  * **现有 AWS 生态系统** ：已在使用 AWS 服务


## [🚀 快速开始](https://nextdevkit.com/zh/docs/deployment#-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
### [1. 选择您的平台](https://nextdevkit.com/zh/docs/deployment#1-%E9%80%89%E6%8B%A9%E6%82%A8%E7%9A%84%E5%B9%B3%E5%8F%B0)
根据您的主要需求选择：
  * **通用** ：Vercel
  * **成本效益** ：Cloudflare
  * **合规** ：AWS


### [2. 遵循平台指南](https://nextdevkit.com/zh/docs/deployment#2-%E9%81%B5%E5%BE%AA%E5%B9%B3%E5%8F%B0%E6%8C%87%E5%8D%97)
  * **[Vercel 部署 →](https://nextdevkit.com/docs/deployment/vercel)**
  * **[Cloudflare 部署 →](https://nextdevkit.com/docs/deployment/cloudflare-worker)**
  * **[AWS 部署 →](https://nextdevkit.com/docs/deployment/sst-aws)**
  * **[容器部署 →](https://nextdevkit.com/docs/deployment/container)**


### [3. 配置环境](https://nextdevkit.com/zh/docs/deployment#3-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83)
每个平台都需要特定的环境变量配置，详见各自的指南。
## [📋 下一步](https://nextdevkit.com/zh/docs/deployment#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
  1. **选择您的平台** ：根据您的要求进行选择
  2. **遵循部署指南** ：使用特定平台的说明
  3. **监控您的应用程序** ：设置基本监控和警报


准备部署了吗？选择您的平台并开始！🚀
[环境变量参考 全面了解、配置和管理 NEXTDEVKIT 在不同部署平台上的所有环境变量的完整指南。](https://nextdevkit.com/zh/docs/environment-variables)[Vercel 零配置将 NEXTDEVKIT 部署到 Vercel](https://nextdevkit.com/zh/docs/deployment/vercel)
[](https://nextdevkit.com/zh/docs/deployment#-%E5%8E%9F%E7%94%9F%E6%94%AF%E6%8C%81%E7%9A%84%E5%B9%B3%E5%8F%B0)[](https://nextdevkit.com/zh/docs/deployment#%E4%B8%BB%E8%A6%81%E5%B9%B3%E5%8F%B0)[](https://nextdevkit.com/zh/docs/deployment#aws-%E9%83%A8%E7%BD%B2%E9%80%89%E9%A1%B9)[](https://nextdevkit.com/zh/docs/deployment#-%E5%AE%B9%E5%99%A8%E5%8C%96%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment#-cloudflare---%E6%9C%80%E5%85%B7%E6%88%90%E6%9C%AC%E6%95%88%E7%9B%8A)[](https://nextdevkit.com/zh/docs/deployment#%E5%85%B3%E9%94%AE%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/deployment#%E6%88%90%E6%9C%AC%E4%BC%98%E5%8A%BF)[](https://nextdevkit.com/zh/docs/deployment#-aws---%E6%9C%80%E5%90%88%E8%A7%84)[](https://nextdevkit.com/zh/docs/deployment#%E5%90%88%E8%A7%84%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/deployment#%E9%83%A8%E7%BD%B2%E9%80%89%E9%A1%B9)[](https://nextdevkit.com/zh/docs/deployment#1-%E6%97%A0%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment#2-ecs-%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment#-%E5%B9%B3%E5%8F%B0%E6%AF%94%E8%BE%83)[](https://nextdevkit.com/zh/docs/deployment#%E4%BD%95%E6%97%B6%E9%80%89%E6%8B%A9-vercel)[](https://nextdevkit.com/zh/docs/deployment#%E4%BD%95%E6%97%B6%E9%80%89%E6%8B%A9-cloudflare)[](https://nextdevkit.com/zh/docs/deployment#%E4%BD%95%E6%97%B6%E9%80%89%E6%8B%A9-aws)[](https://nextdevkit.com/zh/docs/deployment#-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)[](https://nextdevkit.com/zh/docs/deployment#1-%E9%80%89%E6%8B%A9%E6%82%A8%E7%9A%84%E5%B9%B3%E5%8F%B0)[](https://nextdevkit.com/zh/docs/deployment#2-%E9%81%B5%E5%BE%AA%E5%B9%B3%E5%8F%B0%E6%8C%87%E5%8D%97)[](https://nextdevkit.com/zh/docs/deployment#3-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83)[](https://nextdevkit.com/zh/docs/deployment#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
