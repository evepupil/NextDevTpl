# 来源: https://nextdevkit.com/zh/docs/tech-stack

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
技术栈核心框架
# 技术栈
了解使 NEXTDEVKIT 成为一个全面且现代的启动工具包的强大技术和工具。
为了更好地理解代码库，让我们了解一下 NEXTDEVKIT 使用的工具和库以及我们选择它们的原因。这个现代技术栈确保您使用最新和最可靠的技术进行构建，特别注重 AI 友好性和开发者体验。
![NEXTDEVKIT 技术栈](https://nextdevkit.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffeature-techstacks.8bf1ebd1.png&w=3840&q=75)
## [核心框架](https://nextdevkit.com/zh/docs/tech-stack#%E6%A0%B8%E5%BF%83%E6%A1%86%E6%9E%B6)
### [Next.js 15](https://nextdevkit.com/zh/docs/tech-stack#nextjs-15)
  * **服务器端渲染 (SSR)** 以改善 SEO 和性能
  * **Server Actions** 用于服务器端数据处理
  * **API 路由** 为后端功能提供服务
  * **App Router** 用于具有布局和嵌套路由的现代路由
  * **React 19 支持** 使用最新的 React 特性
  * **内置优化** 用于图像、字体和脚本
  * **Turbopack** 用于更快的开发构建


### [React 19](https://nextdevkit.com/zh/docs/tech-stack#react-19)
最新的 React 版本，具有前沿功能：
  * **服务器组件** - 在服务器上运行组件以获得更好的性能
  * **Actions** - 简化的表单处理和数据变更
  * **改进的 Hooks** - 更好的 useEffect 和 useState 行为
  * **自动批处理** - 增强的渲染性能


## [数据库和 ORM](https://nextdevkit.com/zh/docs/tech-stack#%E6%95%B0%E6%8D%AE%E5%BA%93%E5%92%8C-orm)
### [Drizzle ORM](https://nextdevkit.com/zh/docs/tech-stack#drizzle-orm)
  * **类型安全** - 从您的架构自动生成 TypeScript 类型
  * **类似 SQL 的语法** - 编写对 SQL 开发人员来说自然的查询
  * **零运行时开销** - 编译为高效的 SQL 查询
  * **多数据库支持** - 支持 PostgreSQL、MySQL、SQLite、D1 等
  * **迁移系统** - 轻松的架构迁移和版本控制
  * **边缘兼容** - 完美适配 Serverless 和边缘环境
  * **Drizzle Kit** - 强大的 CLI 工具用于迁移和数据库管理


### [Drizzle Zod](https://nextdevkit.com/zh/docs/tech-stack#drizzle-zod)
  * **架构验证** - 从 Drizzle 架构自动生成 Zod 架构
  * **类型推断** - 完整的 TypeScript 类型推断
  * **表单验证** - 与 React Hook Form 完美配合


## [身份验证](https://nextdevkit.com/zh/docs/tech-stack#%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)
### [Better Auth](https://nextdevkit.com/zh/docs/tech-stack#better-auth)
  * **多种身份验证方法** - 邮箱/密码、社交登录、魔法链接
  * **会话管理** - 具有可自定义选项的安全会话处理
  * **社交提供商** - 内置支持 Google、GitHub、Discord 等
  * **类型安全** - 完整的 TypeScript 支持和自动生成的类型
  * **数据库无关** - 通过适配器与任何数据库配合使用
  * **可自定义** - 完全控制身份验证流程和用户数据
  * **安全特性** - 内置 CSRF 保护、速率限制等


## [UI 和样式](https://nextdevkit.com/zh/docs/tech-stack#ui-%E5%92%8C%E6%A0%B7%E5%BC%8F)
### [Tailwind CSS 4](https://nextdevkit.com/zh/docs/tech-stack#tailwind-css-4)
  * **工具优先方法** - 无需编写 CSS 即可构建自定义设计
  * **响应式设计** - 移动优先的响应式工具
  * **深色模式支持** - 内置深色模式功能
  * **可自定义** - 通过配置轻松自定义主题
  * **性能** - 自动清除未使用的样式
  * **PostCSS 集成** - 现代 CSS 处理
  * **AI 友好** - AI 工具在生成 Tailwind 代码方面表现出色


### [Shadcn/UI](https://nextdevkit.com/zh/docs/tech-stack#shadcnui)
  * **默认可访问** - ARIA 兼容组件
  * **可自定义** - 易于修改和扩展
  * **复制粘贴** - 拥有您的组件，不依赖库
  * **一致的设计** - 统一的设计系统
  * **TypeScript 支持** - 完整的类型安全
  * **丰富的生态** - 拥有大量社区预构建组件


### [Radix UI](https://nextdevkit.com/zh/docs/tech-stack#radix-ui)
  * **可访问性优先** - WAI-ARIA 兼容组件
  * **无样式** - 完全控制样式
  * **可组合** - 从简单原语构建复杂组件
  * **键盘导航** - 完整的键盘支持
  * **焦点管理** - 正确的焦点处理


### [Framer Motion](https://nextdevkit.com/zh/docs/tech-stack#framer-motion)
  * **声明式动画** - 简单的声明式语法
  * **手势识别** - 内置拖动、点击和悬停手势
  * **布局动画** - 自动布局转换
  * **弹簧物理** - 使用弹簧动画的自然运动
  * **服务器端渲染** - 与 Next.js SSR 配合使用


## [表单处理](https://nextdevkit.com/zh/docs/tech-stack#%E8%A1%A8%E5%8D%95%E5%A4%84%E7%90%86)
### [React Hook Form](https://nextdevkit.com/zh/docs/tech-stack#react-hook-form)
  * **性能** - 最小化重新渲染
  * **内置验证** - 无需额外库的表单验证
  * **TypeScript 支持** - 完整的类型安全
  * **灵活** - 与任何 UI 库配合使用
  * **解析器集成** - 与 Zod 和其他验证器无缝配合


### [Zod](https://nextdevkit.com/zh/docs/tech-stack#zod)
  * **类型推断** - 自动生成 TypeScript 类型
  * **运行时验证** - 在运行时验证数据
  * **可组合** - 从简单架构构建复杂架构
  * **错误处理** - 详细的错误消息
  * **集成** - 与 React Hook Form 完美配合


## [数据获取和状态管理](https://nextdevkit.com/zh/docs/tech-stack#%E6%95%B0%E6%8D%AE%E8%8E%B7%E5%8F%96%E5%92%8C%E7%8A%B6%E6%80%81%E7%AE%A1%E7%90%86)
### [TanStack Query (React Query)](https://nextdevkit.com/zh/docs/tech-stack#tanstack-query-react-query)
  * **自动缓存** - 智能数据缓存策略
  * **后台更新** - 自动后台重新获取
  * **乐观更新** - 即时 UI 更新
  * **分页和无限滚动** - 内置分页支持
  * **开发工具** - 出色的调试体验
  * **TypeScript 支持** - 完整的类型安全


### [Zustand](https://nextdevkit.com/zh/docs/tech-stack#zustand)
  * **轻量级** - 小打包大小
  * **简单 API** - 易于学习和使用
  * **TypeScript 支持** - 完整的类型安全
  * **无样板代码** - 最少的设置要求
  * **React Hooks** - 原生 React 集成


## [支付处理](https://nextdevkit.com/zh/docs/tech-stack#%E6%94%AF%E4%BB%98%E5%A4%84%E7%90%86)
### [Stripe](https://nextdevkit.com/zh/docs/tech-stack#stripe)
  * **安全支付处理** - PCI DSS 合规
  * **订阅管理** - 定期计费和订阅处理
  * **全球支持** - 接受全球支付
  * **Webhook 支持** - 实时支付事件通知
  * **仪表板** - 全面的支付分析和管理
  * **强大的 TypeScript 支持** - 官方 TypeScript SDK


### [Creem](https://nextdevkit.com/zh/docs/tech-stack#creem)
  * **无月费** - 对独立开发者来说成本效益高
  * **简单集成** - 易于实施和管理
  * **开发者友好** - 专为独立开发者和小型企业打造
  * **灵活定价** - 各种定价模式，包括终身访问
  * **Webhook 支持** - 实时支付通知


## [邮件和通信](https://nextdevkit.com/zh/docs/tech-stack#%E9%82%AE%E4%BB%B6%E5%92%8C%E9%80%9A%E4%BF%A1)
### [React Email](https://nextdevkit.com/zh/docs/tech-stack#react-email)
  * **React 组件** - 使用熟悉的 React 语法构建邮件
  * **响应式设计** - 移动友好的邮件布局
  * **预览模式** - 开发期间预览邮件
  * **TypeScript 支持** - 完整的类型安全
  * **多提供商** - 与 Resend、SendGrid 等配合使用


### [Resend](https://nextdevkit.com/zh/docs/tech-stack#resend)
  * **简单 API** - 易于集成和使用
  * **React Email 集成** - React Email 的完美伴侣
  * **可靠传递** - 高送达率
  * **邮件日志** - 跟踪邮件传递和打开
  * **Webhooks** - 实时邮件事件通知


## [通知](https://nextdevkit.com/zh/docs/tech-stack#%E9%80%9A%E7%9F%A5)
### [Sonner](https://nextdevkit.com/zh/docs/tech-stack#sonner)
  * **美观设计** - 开箱即用的精美 Toast
  * **可自定义** - 易于自定义外观
  * **可访问** - 屏幕阅读器支持
  * **Promise 处理** - 显示加载、成功和错误状态
  * **堆叠** - 自动 Toast 堆叠和排队


## [数据可视化](https://nextdevkit.com/zh/docs/tech-stack#%E6%95%B0%E6%8D%AE%E5%8F%AF%E8%A7%86%E5%8C%96)
### [Recharts](https://nextdevkit.com/zh/docs/tech-stack#recharts)
  * **声明式** - 使用 React 组件构建图表
  * **可自定义** - 完全控制图表外观
  * **响应式** - 自动适应容器大小
  * **动画** - 流畅的图表转换
  * **TypeScript 支持** - 完整的类型安全
  * **丰富的图表类型** - 折线图、柱状图、面积图、饼图等


### [Number Flow](https://nextdevkit.com/zh/docs/tech-stack#number-flow)
  * **流畅动画** - 美观的数字过渡效果
  * **轻量级** - 小打包大小
  * **可访问** - 屏幕阅读器友好
  * **可自定义** - 灵活的样式选项


## [开发工具](https://nextdevkit.com/zh/docs/tech-stack#%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7)
### [TypeScript](https://nextdevkit.com/zh/docs/tech-stack#typescript)
整个代码库完全支持 TypeScript：
  * **类型安全** - 在编译时捕获错误
  * **更好的 IDE 支持** - 增强的自动完成和重构
  * **自文档化代码** - 类型作为文档
  * **渐进式采用** - 可以增量采用


### [Biome](https://nextdevkit.com/zh/docs/tech-stack#biome)
  * **快速** - 比 ESLint 和 Prettier 快得多
  * **一体化** - 结合格式化和 Linting
  * **ESLint 兼容** - 熟悉的规则和配置
  * **优秀的 DX** - 出色的错误消息
  * **Git 集成** - VCS 感知的 Linting 和格式化


### [Turbopack](https://nextdevkit.com/zh/docs/tech-stack#turbopack)
  * **增量编译** - 仅重新编译更改的文件
  * **快速刷新** - 闪电般快速的热模块替换
  * **原生于 Next.js** - 为 Next.js 开发优化
  * **Rust 驱动** - 使用 Rust 构建以获得最大性能


## [国际化](https://nextdevkit.com/zh/docs/tech-stack#%E5%9B%BD%E9%99%85%E5%8C%96)
### [Next-Intl](https://nextdevkit.com/zh/docs/tech-stack#next-intl)
  * **类型安全消息** - 在编译时捕获缺失的翻译
  * **命名空间支持** - 高效组织翻译
  * **复数形式** - 正确处理复数形式
  * **日期和数字格式化** - 本地化感知格式化
  * **服务器和客户端** - 在服务器和客户端组件中都可使用


## [内容管理](https://nextdevkit.com/zh/docs/tech-stack#%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86)
### [Fumadocs](https://nextdevkit.com/zh/docs/tech-stack#fumadocs)
  * **MDX 支持** - 使用 React 组件编写文档
  * **搜索功能** - 内置 Orama 集成搜索
  * **目录** - 自动生成目录
  * **代码高亮** - 代码块语法高亮
  * **响应式设计** - 移动友好的文档
  * **数学支持** - KaTeX 集成用于数学表达式


### [MDX](https://nextdevkit.com/zh/docs/tech-stack#mdx)
  * **React 组件** - 在 Markdown 中使用 React 组件
  * **灵活** - 将 Markdown 与交互元素结合
  * **类型安全** - 完整的 TypeScript 支持
  * **丰富内容** - 创建交互式文档


## [服务器操作](https://nextdevkit.com/zh/docs/tech-stack#%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%93%8D%E4%BD%9C)
### [Next Safe Action](https://nextdevkit.com/zh/docs/tech-stack#next-safe-action)
  * **类型安全** - 服务器操作的完整 TypeScript 支持
  * **验证** - 使用 Zod 进行内置输入验证
  * **错误处理** - 结构化错误处理
  * **中间件支持** - 向操作添加自定义中间件
  * **加载状态** - 自动加载状态管理


## [隐私和合规性](https://nextdevkit.com/zh/docs/tech-stack#%E9%9A%90%E7%A7%81%E5%92%8C%E5%90%88%E8%A7%84%E6%80%A7)
### [Vanilla Cookie Consent](https://nextdevkit.com/zh/docs/tech-stack#vanilla-cookie-consent)
  * **GDPR 合规** - 符合欧洲隐私法规
  * **可自定义** - 灵活的外观和行为
  * **轻量级** - 小打包大小
  * **多语言** - 内置国际化
  * **分析集成** - 与 Google Analytics、Umami 等配合使用


## [存储](https://nextdevkit.com/zh/docs/tech-stack#%E5%AD%98%E5%82%A8)
### [多提供商存储](https://nextdevkit.com/zh/docs/tech-stack#%E5%A4%9A%E6%8F%90%E4%BE%9B%E5%95%86%E5%AD%98%E5%82%A8)
内置存储抽象，支持：
  * **Amazon S3** - 可扩展的对象存储
  * **Cloudflare R2** - S3 兼容存储，零出口费用
  * **本地存储** - 开发和测试
  * **统一 API** - 跨提供商的相同接口
  * **预签名 URL** - 安全的直接上传和下载


## [部署平台](https://nextdevkit.com/zh/docs/tech-stack#%E9%83%A8%E7%BD%B2%E5%B9%B3%E5%8F%B0)
### [多平台支持](https://nextdevkit.com/zh/docs/tech-stack#%E5%A4%9A%E5%B9%B3%E5%8F%B0%E6%94%AF%E6%8C%81)
NEXTDEVKIT 独特地支持多个平台的原生部署：
#### [Vercel](https://nextdevkit.com/zh/docs/tech-stack#vercel)
  * **零配置部署** - 单个命令部署
  * **边缘运行时** - 全球边缘网络以获得最佳性能
  * **无服务器函数** - 自动扩展
  * **预览部署** - 在上线前测试更改


#### [Cloudflare Workers](https://nextdevkit.com/zh/docs/tech-stack#cloudflare-workers)
  * **边缘计算** - 在全球更接近用户的地方运行代码
  * **Cloudflare D1** - 无服务器 SQLite 数据库
  * **Cloudflare R2** - 与 S3 兼容的对象存储
  * **Cloudflare KV** - 用于缓存和 ISR 的全球键值存储
  * **Durable Objects** - 有状态的无服务器对象
  * **成本效益** - 每月 $5 即可获得全面资源


### [OpenNext](https://nextdevkit.com/zh/docs/tech-stack#opennext)
  * **平台无关** - 在任何地方部署 Next.js 应用
  * **无服务器优化** - 为无服务器环境优化
  * **边缘支持** - 在边缘网络上运行
  * **Node.js 兼容性** - 在 Workers 中支持 Node.js API
  * **ISR 支持** - 边缘上的增量静态再生


#### [AWS with SST](https://nextdevkit.com/zh/docs/tech-stack#aws-with-sst)
  * **企业级基础设施** - 可扩展且合规
  * **AWS Lambda** - 无服务器计算
  * **Amazon RDS** - 托管数据库服务
  * **Amazon S3** - 对象存储
  * **CloudFront** - 全球内容分发
  * **基础设施即代码** - 使用 SST/Pulumi 管理基础设施


## [为什么选择这个技术栈？](https://nextdevkit.com/zh/docs/tech-stack#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9%E8%BF%99%E4%B8%AA%E6%8A%80%E6%9C%AF%E6%A0%88)
这个技术栈是基于几个关键标准精心选择的：
  1. **AI 友好性** - 在 2025 年，AI 友好的技术栈至关重要。Next.js、Tailwind CSS 和 TypeScript 等工具拥有广泛的文档和示例，AI 模型可以从中学习，使用 AI 辅助开发显著加快速度。
  2. **开发者体验** - 现代工具和出色的 DX，包括用于快速 Linting/格式化的 Biome、用于快速开发的 Turbopack 以及整个项目的全面 TypeScript 支持。
  3. **类型安全** - 整个技术栈都使用 TypeScript，从使用 Drizzle 的数据库架构到使用 Next Safe Action 的服务器操作，确保在编译时捕获错误。
  4. **性能** - 针对速度和可扩展性进行优化，支持边缘计算、高效打包和优化的渲染策略。
  5. **灵活性** - 无需更改代码即可部署到多个平台（Vercel、Cloudflare Workers、AWS），支持各种部署策略。
  6. **可维护性** - 干净、结构良好的代码，最少的依赖关系和清晰的关注点分离。
  7. **安全性** - 内置安全最佳实践，包括 Better Auth、安全的服务器操作和适当的数据验证。
  8. **可访问性** - 使用 Radix UI 的 WCAG 合规组件和整个项目的适当可访问性模式。
  9. **社区和生态系统** - 所有技术都有活跃的社区、全面的文档和定期更新。


了解这些技术对于使用 NEXTDEVKIT 构建成功的 SaaS 应用程序至关重要。每个工具都是基于其可靠性、性能、开发者体验和 AI 友好性而选择的。
[介绍 欢迎使用 NEXTDEVKIT - 构建生产级别的 SaaS 应用程序的 Next.js + OpenNext 代码模板，支持多平台原生部署。](https://nextdevkit.com/zh/docs)[项目初始化 本章讲述如何下载代码，安装命令行和 IDE 插件。初始化 NEXTDEVKIT 项目。](https://nextdevkit.com/zh/docs/pre)
[](https://nextdevkit.com/zh/docs/tech-stack#%E6%A0%B8%E5%BF%83%E6%A1%86%E6%9E%B6)[](https://nextdevkit.com/zh/docs/tech-stack#nextjs-15)[](https://nextdevkit.com/zh/docs/tech-stack#react-19)[](https://nextdevkit.com/zh/docs/tech-stack#%E6%95%B0%E6%8D%AE%E5%BA%93%E5%92%8C-orm)[](https://nextdevkit.com/zh/docs/tech-stack#drizzle-orm)[](https://nextdevkit.com/zh/docs/tech-stack#drizzle-zod)[](https://nextdevkit.com/zh/docs/tech-stack#%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)[](https://nextdevkit.com/zh/docs/tech-stack#better-auth)[](https://nextdevkit.com/zh/docs/tech-stack#ui-%E5%92%8C%E6%A0%B7%E5%BC%8F)[](https://nextdevkit.com/zh/docs/tech-stack#tailwind-css-4)[](https://nextdevkit.com/zh/docs/tech-stack#shadcnui)[](https://nextdevkit.com/zh/docs/tech-stack#radix-ui)[](https://nextdevkit.com/zh/docs/tech-stack#framer-motion)[](https://nextdevkit.com/zh/docs/tech-stack#%E8%A1%A8%E5%8D%95%E5%A4%84%E7%90%86)[](https://nextdevkit.com/zh/docs/tech-stack#react-hook-form)[](https://nextdevkit.com/zh/docs/tech-stack#zod)[](https://nextdevkit.com/zh/docs/tech-stack#%E6%95%B0%E6%8D%AE%E8%8E%B7%E5%8F%96%E5%92%8C%E7%8A%B6%E6%80%81%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/tech-stack#tanstack-query-react-query)[](https://nextdevkit.com/zh/docs/tech-stack#zustand)[](https://nextdevkit.com/zh/docs/tech-stack#%E6%94%AF%E4%BB%98%E5%A4%84%E7%90%86)[](https://nextdevkit.com/zh/docs/tech-stack#stripe)[](https://nextdevkit.com/zh/docs/tech-stack#creem)[](https://nextdevkit.com/zh/docs/tech-stack#%E9%82%AE%E4%BB%B6%E5%92%8C%E9%80%9A%E4%BF%A1)[](https://nextdevkit.com/zh/docs/tech-stack#react-email)[](https://nextdevkit.com/zh/docs/tech-stack#resend)[](https://nextdevkit.com/zh/docs/tech-stack#%E9%80%9A%E7%9F%A5)[](https://nextdevkit.com/zh/docs/tech-stack#sonner)[](https://nextdevkit.com/zh/docs/tech-stack#%E6%95%B0%E6%8D%AE%E5%8F%AF%E8%A7%86%E5%8C%96)[](https://nextdevkit.com/zh/docs/tech-stack#recharts)[](https://nextdevkit.com/zh/docs/tech-stack#number-flow)[](https://nextdevkit.com/zh/docs/tech-stack#%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7)[](https://nextdevkit.com/zh/docs/tech-stack#typescript)[](https://nextdevkit.com/zh/docs/tech-stack#biome)[](https://nextdevkit.com/zh/docs/tech-stack#turbopack)[](https://nextdevkit.com/zh/docs/tech-stack#%E5%9B%BD%E9%99%85%E5%8C%96)[](https://nextdevkit.com/zh/docs/tech-stack#next-intl)[](https://nextdevkit.com/zh/docs/tech-stack#%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/tech-stack#fumadocs)[](https://nextdevkit.com/zh/docs/tech-stack#mdx)[](https://nextdevkit.com/zh/docs/tech-stack#%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%93%8D%E4%BD%9C)[](https://nextdevkit.com/zh/docs/tech-stack#next-safe-action)[](https://nextdevkit.com/zh/docs/tech-stack#%E9%9A%90%E7%A7%81%E5%92%8C%E5%90%88%E8%A7%84%E6%80%A7)[](https://nextdevkit.com/zh/docs/tech-stack#vanilla-cookie-consent)[](https://nextdevkit.com/zh/docs/tech-stack#%E5%AD%98%E5%82%A8)[](https://nextdevkit.com/zh/docs/tech-stack#%E5%A4%9A%E6%8F%90%E4%BE%9B%E5%95%86%E5%AD%98%E5%82%A8)[](https://nextdevkit.com/zh/docs/tech-stack#%E9%83%A8%E7%BD%B2%E5%B9%B3%E5%8F%B0)[](https://nextdevkit.com/zh/docs/tech-stack#%E5%A4%9A%E5%B9%B3%E5%8F%B0%E6%94%AF%E6%8C%81)[](https://nextdevkit.com/zh/docs/tech-stack#vercel)[](https://nextdevkit.com/zh/docs/tech-stack#cloudflare-workers)[](https://nextdevkit.com/zh/docs/tech-stack#opennext)[](https://nextdevkit.com/zh/docs/tech-stack#aws-with-sst)[](https://nextdevkit.com/zh/docs/tech-stack#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9%E8%BF%99%E4%B8%AA%E6%8A%80%E6%9C%AF%E6%A0%88)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
![NEXTDEVKIT 技术栈](https://nextdevkit.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffeature-techstacks.8bf1ebd1.png&w=828&q=75)
