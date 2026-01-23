# 来源: https://nextdevkit.com/zh/docs/ai-agents

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
集成 AI 工具选择 AI IDE
# 集成 AI 工具
本教程将帮助你快速上手 NEXTDEVKIT 配合 AI IDE 使用，包括 AI Rules 和 MCP 的安装和使用。
对于当前的时代而言，模板加上 AI 的加持，可以极大的提高开发效率。
对于现在 AI 而言，从零搭建一个完整的，易于扩展的，稳定的 SaaS 项目是比较困难的，因为 AI 不擅长代码抽象和组织整理，并且缺乏对项目架构的认知。
所以大多数完全从零开始使用 AI 来 Vibe Coding 的项目，到了一定阶段，都会遇到脆弱的代码架构，以及难以维护的代码问题。bug 多，代码非常零碎，难以进一步的使用 AI 来 Vibe Coding。
但是如果 AI 基于一个已经有完善的组织架构的项目，有明确的代码结构，如何继续编写代码的指令，以及完善的文档支持。那么使用 AI 来 Vibe Coding 绝对是事半功倍。
NextDevKit 通过 Ruler 项目可以集成大多数现代 AI 开发工具，包括像 AI IDE 例如 Cursor 和 Copilot 等，也支持 Claude Code 和 Gemini 这样的 AI CLI 工具。
NextDevKit 有完善的文档，并且已经默认集成了 Context7 这样的 AI 代理，可以直接通过 MCP 来访问最新文档。并且内置了一套 AI Rules 指令，可以方便快速集成开发功能。
## [选择 AI IDE](https://nextdevkit.com/zh/docs/ai-agents#%E9%80%89%E6%8B%A9-ai-ide)
市面上的 AI IDE 有很多，例如 Cursor、Copilot、Gemini、AugmentCode、Claude Code 等。
NextDevKit 为了集成不同的 AI IDE，所以需要使用 Ruler 项目来管理 AI IDE 的配置。
关于 Ruler 项目，请参考 
所以目前来讲，使用 Ruler 项目支持的 AI Agents 会有更好的体验，如果目前你使用的 AI IDE 不在 Ruler 项目支持的列表中，那么你可以手动将对应的 Rules 和 MCP 配置到你的项目中。
## [AI Rules 指令](https://nextdevkit.com/zh/docs/ai-agents#ai-rules-%E6%8C%87%E4%BB%A4)
NextDevKit 为了可以帮助你更快的进行二次开发，更好的使用 AI 工具，内置了一套 AI Rules 指令，可以方便快速集成开发功能。
```
.ruler/
├── engineering
│   ├── common-commands.md
│   ├── core-files-and-functions.md
│   └── development-guidelines.md
├── instructions.md
├── project
│   └── project-architecture.md
```

### [安装](https://nextdevkit.com/zh/docs/ai-agents#%E5%AE%89%E8%A3%85)
如何将这些 rules 配置到你的 AI IDE 中，那么你首先需要全局安装 Ruler：
```
pnpm install -g @intellectronica/ruler
```

### [快速开始](https://nextdevkit.com/zh/docs/ai-agents#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
将内置的 rules 应用到你的 AI 代理，例如你使用 curosr，那么执行:
```
# 仅应用到特定代理,例如 Cursor
ruler apply --agents cursor
```

更多的你可以到 
### [预配置规则](https://nextdevkit.com/zh/docs/ai-agents#%E9%A2%84%E9%85%8D%E7%BD%AE%E8%A7%84%E5%88%99)
NextDevKit 包含 4 个核心指令文件：
  * 🏗️ **项目架构** - 完整项目结构和技术栈
  * 🛠️ **开发规范** - 编程标准和最佳实践
  * 🔧 **核心功能** - 关键文件位置和函数参考
  * ⚡ **常用命令** - 开发命令和部署流程


### [建议](https://nextdevkit.com/zh/docs/ai-agents#%E5%BB%BA%E8%AE%AE)
AI rules 并不是越多越好，rules 越多可能大模型的幻觉越严重，对于实际开发帮助不大，尽量添加和你需求相关的到你的 prompt 中。
NextDevKit 暂时默认集成了四个 rules 文件，都是基于 NextDevKit 项目结构和功能编写的，你可以将它作为你自己的规则指令参考。
如果你不想使用默认的 rules 文件，那么你可以手动将对应的 Rules 和 MCP 配置到你的项目中。
我强烈建议如果你要使用默认的规则指令，那么你最好仔细阅读其中的指令内容，并且根据你的实际需求进行调整。
例如核心功能的指令文件如下所示，你可以将它作为你自己的规则指令参考。
上面的文件是一个参考，在不同的模板中，例如 cloudflare workers 模板中会有一些专门的变动和优化。
合理的指令规则集加上清晰的 Prompt，绝对能极大的提高开发效率。
## [AI + Docs](https://nextdevkit.com/zh/docs/ai-agents#ai--docs)
除了 AI rule 指令集外，NextDevKit 还提供了全面完善的文档，AI 代理可以通过 Context7 MCP 集成访问这些文档。这确保 AI 始终拥有最新的项目信息。
并且 NextDevKit 的文档提供 [llms.txt](https://nextdevkit.com/llms.txt) 文件支持，可以更好的被 AI 代理和爬虫访问。
优势：
  * 始终访问最新文档
  * 针对 NextDevKit 的上下文化响应
  * 无需手动搜索@相关文档


如果你还需要更多的文档索引支持，也可以通过 Context7 的 MCP 来检索更多的文档。
例如 Better Auth、Drizzle ORM、Shadcn UI 的文档等。
关于如何使用，你只需要简单的告诉 AI 下面的指令即可。
```
帮我通过 Context7 查询 NEXTDEVKIT 的文档，然后 xxxx
```

## [AI + MCP](https://nextdevkit.com/zh/docs/ai-agents#ai--mcp)
我个人的经验是大量的 MCP 集成对于开发效率来讲并没有太大有效果。建议仅仅集成你需要的 MCP 服务器。
### [配置 Context7](https://nextdevkit.com/zh/docs/ai-agents#%E9%85%8D%E7%BD%AE-context7)
配置 Context7 非常简单，你只需要根据官方 GitHub 文档配置即可。
### [使用方法](https://nextdevkit.com/zh/docs/ai-agents#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
配置完成后，向 AI 询问问题如：
  * "Context7 中查询 NextDevKit 如何配置身份验证？"


AI 将自动通过 Context7 查询 NextDevKit 文档。
## [总结](https://nextdevkit.com/zh/docs/ai-agents#%E6%80%BB%E7%BB%93)
好了，这一步你已经完成了 AI Agents 的集成，并且可以开始使用 AI 来 Vibe Coding 了。
下一步你将理解 NextDevKit 代码的结构和组织方式，并且将在本地启动你的服务！
[项目初始化 本章讲述如何下载代码，安装命令行和 IDE 插件。初始化 NEXTDEVKIT 项目。](https://nextdevkit.com/zh/docs/pre)[NextDevKit 项目架构 全面了解 NextDevKit 的项目结构，从基础的 Next.js 设置到生产级 SaaS 架构的完整指南。](https://nextdevkit.com/zh/docs/project-architecture)
[](https://nextdevkit.com/zh/docs/ai-agents#%E9%80%89%E6%8B%A9-ai-ide)[](https://nextdevkit.com/zh/docs/ai-agents#ai-rules-%E6%8C%87%E4%BB%A4)[](https://nextdevkit.com/zh/docs/ai-agents#%E5%AE%89%E8%A3%85)[](https://nextdevkit.com/zh/docs/ai-agents#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)[](https://nextdevkit.com/zh/docs/ai-agents#%E9%A2%84%E9%85%8D%E7%BD%AE%E8%A7%84%E5%88%99)[](https://nextdevkit.com/zh/docs/ai-agents#%E5%BB%BA%E8%AE%AE)[](https://nextdevkit.com/zh/docs/ai-agents#ai--docs)[](https://nextdevkit.com/zh/docs/ai-agents#ai--mcp)[](https://nextdevkit.com/zh/docs/ai-agents#%E9%85%8D%E7%BD%AE-context7)[](https://nextdevkit.com/zh/docs/ai-agents#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)[](https://nextdevkit.com/zh/docs/ai-agents#%E6%80%BB%E7%BB%93)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
