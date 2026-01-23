# 来源: https://nextdevkit.com/zh/docs

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
介绍
# 介绍
欢迎使用 NEXTDEVKIT - 构建生产级别的 SaaS 应用程序的 Next.js + OpenNext 代码模板，支持多平台原生部署。
## [致谢](https://nextdevkit.com/zh/docs#%E8%87%B4%E8%B0%A2)
NEXTDEVKIT 站在巨人的肩膀上。这个模板从 Next.js 生态系统中许多优秀的产品和项目中汲取灵感：
**模板与启动套件** ：像 
**技术栈** ：基于令人惊叹的开源技术构建 - Next.js、Drizzle ORM、Better Auth、Tailwind CSS、Shadcn/UI、OpenNext、SST 等等。这些社区的创新和奉献使 NEXTDEVKIT 这样的项目成为可能。
**社区与生态系统** ：Next.js、React 和更广泛的 JavaScript 社区创建了一个令人惊叹的工具、库和知识生态系统。他们的文档、教程和讨论非常宝贵。
本文档是在 AI 工具的重要协助下创建的。因此，可能与生态系统中的其他项目和文档存在相似之处。
感谢所有让现代 Web 开发生态系统如此强大和易于使用的开发者、维护者和贡献者。🙏
让我们开始吧！🚀
## [为什么我开发一个 Next.js 模板？](https://nextdevkit.com/zh/docs#%E4%B8%BA%E4%BB%80%E4%B9%88%E6%88%91%E5%BC%80%E5%8F%91%E4%B8%80%E4%B8%AA-nextjs-%E6%A8%A1%E6%9D%BF)
其实现在优秀的 Next.js 模板挺多的，只要你在 Google 中搜索 `nextjs saas template` 或者 `nextjs starter kit`，你可以找到很多优秀的模板，包括但不限于开源项目的和商业付费的。
那为什么我还要自己重新开发一套 Nextjs 的模板呢，一方面是因为这些模板或多或少都存在一些问题，以一些开源的项目为例，例如 Vercel 
所以我之前每次启动新项目的时候，我都是去找不同的模板来满足我的需求，但是这样每次都要花费我很多时间，每次都有新的学习成本。
所以我打算自己设计一套模板，解决以下几个我自己的痛点：
### [UI/UX 设计思路写到像](https://nextdevkit.com/zh/docs#uiux-%E8%AE%BE%E8%AE%A1%E6%80%9D%E8%B7%AF%E5%86%99%E5%88%B0%E5%83%8F)
第一个问题是大部分的模板 UI/UX 达不到我的要求，每次我都需要重新大量 UI 和解决响应式问题。所以我打算这一次重新设计一套能够复用大部分项目的 UI，遵循一些设计的最佳实践。
### [复杂度和功能性](https://nextdevkit.com/zh/docs#%E5%A4%8D%E6%9D%82%E5%BA%A6%E5%92%8C%E5%8A%9F%E8%83%BD%E6%80%A7)
第二个问题是复杂度的问题，虽然有些模板功能齐全，但是代码的复杂度挺高的，特别是使用 monorepo 设计的模板，虽然我还挺喜欢 monorepo 的，monorepo 的架构可以方便的进行依赖管理和分层抽象，但是对于初学者来说，学习成本和维护成本都很高。
所以，我这次在设计模板的时候，也是尽可能的简化代码的复杂度，使用传统的 Next.js 的项目结构，并且尽可能的减少第三方库的使用。
但说实话，从我开发这个模板的过程中，发现对于一个商业付费模板而言，复杂度和功能性的平衡是最难把握的一点。
加入一些功能是很容易的，但是要保证模板使用者的学习成本和后续的维护成本是很困难的。
所以这次设计的代码，我的首要目标是在模板简单的基础上，保证完整的功能性，例如：
  * [数据库集成](https://nextdevkit.com/docs/database)
  * [认证](https://nextdevkit.com/docs/authentication)
  * [邮件](https://nextdevkit.com/docs/email)
  * [支付](https://nextdevkit.com/docs/payment)
  * [存储](https://nextdevkit.com/docs/storage)
  * [博客](https://nextdevkit.com/docs/blog)
  * [文档](https://nextdevkit.com/docs/docs)
  * [国际化](https://nextdevkit.com/docs/i18n)
  * [分析](https://nextdevkit.com/docs/analytics)
  * [多主题](https://nextdevkit.com/docs/themes)
  * [SEO 优化](https://nextdevkit.com/docs/seo)


### [部署的难题](https://nextdevkit.com/zh/docs#%E9%83%A8%E7%BD%B2%E7%9A%84%E9%9A%BE%E9%A2%98)
第三个问题是现在市面上所有的 Next.js 模板，都存在一个共同的问题，那就是部署的难题。
因为 Next.js 的部署方式非常多样，包括但不限于 Vercel, Cloudflare Workers, AWS, Railway, Fly.io, Zeabur, GCP, Azure 和自托管部署等等。
每个平台都有不同的优缺点，例如 Next.js 的官方部署平台 
还有一大类是像 Cloudflare Workers 这样的平台，价格非常的便宜，每个月 $5 就可以放心大胆的使用 Workers, R2, D1, KV 等等资源，并且还有免费的 CDN 和 DNS 服务，对于独立开发者来说，是一个非常不错的选择。
但是 Cloudflare 的缺点也很明显，那就是社区和官方对于 Next.js 的支持到目前为止都一般，并且有 10MB 打包大小的限制，如果你要重头开发一个能够部署到 Cloudflare Workers 的 SaaS 应用，会遇到很多的问题，我在设计 NextDevKit Cloudflare workers 模板的时候，也是解决了很多的难题，因为有很多库和第三方的不支持 workers 环境，并且要保证最终打包大小控制在 3MB 左右，还是比较困难的。
> 模板最终打包大小为 3MB - 4MB 之间，已经默认集成了 Workers, R2, D1, KV 等等资源，只要不是大型项目，应该是游刃有余的。并且 Standard 版本还支持 D1, KV 等额度，可以放心大胆的使用。但是如果你后续需要引入大量的依赖库，那么打包大小可能会超过 10MB，这种情况下则推荐使用标准版部署。
最后还有一类是像 AWS, GCP, Azure 这样的云平台，因为有一些项目的合规性和隐私性问题，所以必须选择这些大的云平台来部署。
这些平台虽然功能支持的非常全面，但是部署起来非常麻烦，需要花费大量的时间去配置和优化，每次都需要从基础设施开始搭建。
所以，我这次专门设计了 NextDevKit AWS 模板，也是尽可能的简化部署的难度，使用 
最后，是对于容器部署的支持，本次设计的模板除了对 Cloudflare Workers 和 AWS 原生支持来减少部署的难度之外，其它平台都暂时仅支持容器部署，像 Railway, Fly.io, Dokploy, Coolify 等。
## [模板功能](https://nextdevkit.com/zh/docs#%E6%A8%A1%E6%9D%BF%E5%8A%9F%E8%83%BD)
### [UI 和主题](https://nextdevkit.com/zh/docs#ui-%E5%92%8C%E4%B8%BB%E9%A2%98)
上面介绍完了为什么我开发这个模板，以及我对于这个模板的设计理念，下面我来介绍一下这个模板的功能和遇到的一些难题。
首先是 Landing Page (落地页) 的开发，因为对于启动一个新项目而言，Landing Page 是必不可少的一步，是用户了解你的项目的第一印象，所以对于 Landing Page 的开发，我也是花费了大量的时间来设计，包括但不限于调研高转化率的 Landing Page 的样式，实现这些组件，保持样式的统一等。
像目前的 Landing page 就是参考了一个高转化率的 Landing Page 的样式，大家可以访问 [nextdevkit demo](https://demo.nextdevkit.com) 查看效果。
你可能会顾虑使用这个模板来开发不同的项目，对于每个项目的 Landing page 相同是不是会审美疲劳，对于这个问题我也进行了思考，感谢 
  * [NextDevKit 官网主题](https://nextdevkit.com)
  * [NextDevKit Demo 主题](https://demo.nextdevkit.com)
  * [NextDevKit AWS Demo 主题](https://aws.nextdevkit.com)
  * [NextDevKit Workers Demo 主题](https://workers.nextdevkit.com)


可以看到除了颜色会进行变化外，有一些小组件的样式也会发生变化，例如 `button`，`input`，`card` 的样式，还有 `padding`，`margin`，`border-radius` 等，无论你喜欢哪种风格，这些组件都能做到保持相对的统一和好看。
还有包括但不限于登录注册页面，设置页面，Dashboard 页面，每个页面的 UI 样式我都尽量保持一致，不会出现很突兀的组件样式。后续你只需要让 AI IDE 模仿这些组件的样式进行开发即可，能够很大程度减少从头开发 UI 样式的焦虑和挫败。
当然对于暗黑模式和移动端支持也是无条件支持的，还有像 Blog 页面我都专门进行 Notion 的样式设计靠齐，尽量保持简洁和现代，不会很简陋或者复杂。甚至连 404 页面我都进行了专门的设计，当然你也完全可以在模板中修改这些默认样式，你可以访问 [nextdevkit demo 404](https://demo.nextdevkit.com/404) 查看效果。
### [技术选型](https://nextdevkit.com/zh/docs#%E6%8A%80%E6%9C%AF%E9%80%89%E5%9E%8B)
对于一个模板而言，最大的作用就是加快开发速度，所以对于技术选型，我也是尽可能的选用最流行和最好用的技术栈。
之前我有一篇博客是介绍 
毕竟对于现在 2025 年的开发而言，对于开发者友好的技术栈还在其次，对于 AI 友好的技术栈才是王道。只要这个技术栈的生态能够被 AI 学习，开发者就能事半功倍。下面是选型技术栈的详细介绍。
  * 框架使用 Next.js 最新版本，支持了 React 19 的特性，对于全栈开发而言，目前没有一个框架能比 AI 写 Next.js 更快更准确了。
  * 使用 Tailwind CSS 4 版本，Tailwind CSS 是一种 AI 友好的代码风格。在 AI IDE 出现后，其它 CSS 框架都逐渐消亡。
  * 使用 Shadcn UI 组件，Shadcn UI 目前生态广，组件也非常丰富，选型理由还是 AI First。并且后续会在社区分享到哪里找到好看的组件，Shadcn 组件进行快速开发。
  * 数据库 ORM 使用 Drizzle ORM，目前能够进行选择范围的只有 Drizzle ORM 和 Prisma ORM，其实我个人觉得 Prisma 的开发体验和代码设计都挺好的，但是架不住 Drizzle 的性能好，生态完善。因为模板需要部署到 Serverless 平台，所以需要选择一个面向 Edge 环境的 ORM，Drizzle 是最佳选择。
  * Auth 选择的是 Better Auth，没有选择 NextAuth(Auth.js) 的原因是因为文档不行，并且过去几年一直在变动。反而用过 Better Auth 后，发现开发体验和代码设计都很好，生态非常完善，对于 Auth 这种安全框架来讲，千万不要重复造轮子，选择一个生态完善，文档齐全，并且有社区支持的框架就是最好的选择。
  * Blog 和 Docs 我选择了 FumaDocs + FumaDocs MDX 来开发，FumaDocs 是我今年发现的一个非常好的文档框架，本来我以往都是使用 Content Collection 来开发，但是后来发现 FumaDocs 的代码设计和社区活跃度都很好，特别是 FumaDocs 的作者，在 Github 上非常活跃，并且对于文档的开发和维护也非常用心。
  * 邮件服务使用 Resend，支付服务使用 Stripe / Creem，Resend 和 Stripe 这两个服务都是目前最流行的服务，生态非常完善，并且对于开发者非常友好。后续也会支持其它的第三方，特别是支付，后续会对于一些支持国内开发者的支付服务进行优先支持。
  * Storeage 对象存储优先支持 AWS S3 和 Cloudflare R2，其实这两个使用的是同一个协议，只要是使用 S3 协议的理论上都支持。
  * i18n 国际化使用的是 next-intl，其实加上 i18n 功能后，整个项目的代码复杂度提高了一个级别，因为需要支持多语言，所以一些变量的抽取和跳转需要单独处理，但是 i18n 对于很多人来讲又是必要的，所以最后还是加上了。
  * AI 功能使用的是 Vercel AI SDK 和 AI Elements，对于 AI 功能的支持还是非常全面的。


除了上面的技术栈外，还有一些特殊的优化，例如对于 Cookie 和 Analytics 的优化，Analytics 目前支持 Google Analytics，Umami，Plausible 等，后续会支持更多。并且我针对于 GDPR 等隐私收集法规，在模板中进行了专门的优化，如果用户不同意收集数据，则不会收集任何数据。
除此之外，对于 SEO，我也是进行了专门的优化，包括但不限于 sitemap 的生成，robots.txt 的生成，og:image 的生成，不同页面的 metadata 的生成等，博客的 keywords 优化等。
## [写在最后](https://nextdevkit.com/zh/docs#%E5%86%99%E5%9C%A8%E6%9C%80%E5%90%8E)
如果你有我类似的痛点，或者是想通过 Next.js 来开发 SaaS 服务，亦或者是来构建一个全栈项目，那么这个模板能帮助你省下一两个月的时间，个人在代码调优和配置上花费了大量的时间，可以通过简单的配置就完成项目的初始化。并且通过 AI 和 Cursor 的后续辅助，能够大大加快你的想法到项目落地的速度。
[技术栈 了解使 NEXTDEVKIT 成为一个全面且现代的启动工具包的强大技术和工具。](https://nextdevkit.com/zh/docs/tech-stack)
[](https://nextdevkit.com/zh/docs#%E8%87%B4%E8%B0%A2)[](https://nextdevkit.com/zh/docs#%E4%B8%BA%E4%BB%80%E4%B9%88%E6%88%91%E5%BC%80%E5%8F%91%E4%B8%80%E4%B8%AA-nextjs-%E6%A8%A1%E6%9D%BF)[](https://nextdevkit.com/zh/docs#uiux-%E8%AE%BE%E8%AE%A1%E6%80%9D%E8%B7%AF%E5%86%99%E5%88%B0%E5%83%8F)[](https://nextdevkit.com/zh/docs#%E5%A4%8D%E6%9D%82%E5%BA%A6%E5%92%8C%E5%8A%9F%E8%83%BD%E6%80%A7)[](https://nextdevkit.com/zh/docs#%E9%83%A8%E7%BD%B2%E7%9A%84%E9%9A%BE%E9%A2%98)[](https://nextdevkit.com/zh/docs#%E6%A8%A1%E6%9D%BF%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs#ui-%E5%92%8C%E4%B8%BB%E9%A2%98)[](https://nextdevkit.com/zh/docs#%E6%8A%80%E6%9C%AF%E9%80%89%E5%9E%8B)[](https://nextdevkit.com/zh/docs#%E5%86%99%E5%9C%A8%E6%9C%80%E5%90%8E)
