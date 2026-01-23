# 来源: https://nextdevkit.com/zh/docs/pre

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
项目初始化管理代码仓库
# 项目初始化
本章讲述如何下载代码，安装命令行和 IDE 插件。初始化 NEXTDEVKIT 项目。
在购买模板的时候，会要求输入 GitHub 账号名称，购买成功后会自动将代码仓库的权限邀请发送给用户。
你可以在 GitHub 账号关联的邮箱里或者 
只要你可以打开对应的 NextDevKit 代码仓库网页，就说明你已经接受了权限邀请，并且有权限 clone 和阅读代码。
GITHUB 模板链接:
  * Next.js Starter Kit: 
  * Cloudflare Workers Template Link: 
  * SST AWS Template Link: 


## [管理代码仓库](https://nextdevkit.com/zh/docs/pre#%E7%AE%A1%E7%90%86%E4%BB%A3%E7%A0%81%E4%BB%93%E5%BA%93)
在拥有权限后，你需要将代码复制到你的私有仓库进行开发。根据你的使用场景，有以下几种方式：
### [方式一：Fork 仓库（仅适用于单项目）](https://nextdevkit.com/zh/docs/pre#%E6%96%B9%E5%BC%8F%E4%B8%80fork-%E4%BB%93%E5%BA%93%E4%BB%85%E9%80%82%E7%94%A8%E4%BA%8E%E5%8D%95%E9%A1%B9%E7%9B%AE)
**⚠️ 重要限制：GitHub 只允许对同一个仓库 fork 一次。如果你需要创建多个项目，请使用方式二或方式三。**
**适用场景：**
  * 你只需要创建一个基于 NextDevKit 的项目
  * 你希望能够同步上游仓库的更新
  * 你希望能够向原仓库提交 PR（如果需要）


**操作步骤：**
  1. 在 NextDevKit 模板仓库页面点击右上角的 "Fork" 按钮
  2. 选择你的 GitHub 账号或组织
  3. 确保勾选 "Copy the main branch only"（仅复制主分支）
  4. 将 fork 后的仓库 clone 到本地开发


**优点：**
  * 可以通过 GitHub 的 "Sync fork" 功能同步上游更新
  * 保留完整的 Git 历史记录
  * 可以向原仓库提交 PR


**缺点：**
  * 每个 GitHub 账号只能 fork 一次，无法用于多项目


![fork-clone](https://nextdevkit.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ftutorials-pre-fork-clone.6818a9d8.png&w=3840&q=75)
### [方式二：Clone + 手动创建新仓库（推荐用于多项目）](https://nextdevkit.com/zh/docs/pre#%E6%96%B9%E5%BC%8F%E4%BA%8Cclone--%E6%89%8B%E5%8A%A8%E5%88%9B%E5%BB%BA%E6%96%B0%E4%BB%93%E5%BA%93%E6%8E%A8%E8%8D%90%E7%94%A8%E4%BA%8E%E5%A4%9A%E9%A1%B9%E7%9B%AE)
**适用场景：**
  * 你需要创建多个基于 NextDevKit 的项目
  * 你希望每个项目都有独立的 Git 仓库
  * 你不需要同步上游更新，或者通过手动合并方式更新


**操作步骤：**
  1. Clone 源仓库到本地：


```
git clone https://github.com/nextdevkit/nextdevkit-template.git my-project-name
cd my-project-name
```

  1. 在 GitHub 创建新的私有仓库，然后关联：


```
git remote add origin https://github.com/your-username/your-new-repo.git
git branch -M main
git push -u origin main
```

**优点：**
  * 可以创建无限个项目
  * 每个项目独立管理，互不影响


### [方式三：使用 GitHub CLI（最便捷，推荐）](https://nextdevkit.com/zh/docs/pre#%E6%96%B9%E5%BC%8F%E4%B8%89%E4%BD%BF%E7%94%A8-github-cli%E6%9C%80%E4%BE%BF%E6%8D%B7%E6%8E%A8%E8%8D%90)
**适用场景：**
  * 你需要快速创建多个项目
  * 你希望自动化创建仓库的过程
  * 你已经安装了 GitHub CLI 工具


**操作步骤：**
  1. 确保已安装并登录 GitHub CLI：


```
gh auth login
```

  1. Clone 并创建新仓库（一条命令完成）：


```
# 下载模板代码
git clone https://github.com/nextdevkit/nextdevkit-template.git my-project-name
cd my-project-name
# 使用 gh 创建新仓库并推送
gh repo create my-project-name --private --source=. --push
```

**优点：**
  * 最快速便捷的方式
  * 一条命令自动创建远程仓库并推送
  * 适合频繁创建新项目


### [重要提醒](https://nextdevkit.com/zh/docs/pre#%E9%87%8D%E8%A6%81%E6%8F%90%E9%86%92)
**无论使用哪种方式，都必须确保：**
  1. ✅ 使用**私有仓库** （Private Repository）
  2. ❌ 请勿将代码提交到公共仓库
  3. ⚠️ 如果团队协作，确保只邀请授权的成员


感谢你的理解与配合！
## [clone 代码（适用于方式一和方式二）](https://nextdevkit.com/zh/docs/pre#clone-%E4%BB%A3%E7%A0%81%E9%80%82%E7%94%A8%E4%BA%8E%E6%96%B9%E5%BC%8F%E4%B8%80%E5%92%8C%E6%96%B9%E5%BC%8F%E4%BA%8C)
在选择 clone 代码的时候，常用的有两种方式，一种是 HTTPS 方式，一种是 SSH 方式。
### [HTTPS 方式](https://nextdevkit.com/zh/docs/pre#https-%E6%96%B9%E5%BC%8F)
使用 HTTPS 方式 clone 代码，更推荐使用 GitHub 官方的 cli 工具 
如果你是第一次使用 gh 工具，需要先进行登录。
```
gh auth login
```

如果你已经使用过 gh 工具，并且已经登录过，还无法 clone 代码，那么需要检查你的 gh 登录账号是否正确。
```
gh auth status
```

如果登录账号不正确，那么需要重新登录。
接着你可以使用传统的 git clone 命令进行 clone 代码。注意替换你需要 clone 的代码仓库的 URL。
```
git clone https://github.com/nextdevkit/nextdevkit-template.git
```

### [SSH 方式](https://nextdevkit.com/zh/docs/pre#ssh-%E6%96%B9%E5%BC%8F)
第二种方式是使用 SSH 方式 clone 代码，首先需要生成 SSH 密钥。你可以修改 ed25519 为其它名字。
```
ssh-keygen -t ed25519 -C "your_email@example.com"
```

接着将生成的公钥添加到 GitHub 中。
```
cat ~/.ssh/id_ed25519.pub
```

在 GitHub 的右上角，点击你的头像，然后点击 Settings。在侧边栏的 "Access" 部分，点击 SSH and GPG keys。点击 New SSH key or Add SSH key。将生成的公钥粘贴到 Key 文本框中。点击 Add SSH key 按钮。
更多细节请参考 
接着你就可以使用 SSH 方式 clone 代码了。
```
git clone git@github.com:nextdevkit/nextdevkit-template.git
```

以上两种方式对于私有仓库来讲，都是最比较常用的 clone 代码的方式。具体选择看个人习惯。
## [安装 IDE 插件](https://nextdevkit.com/zh/docs/pre#%E5%AE%89%E8%A3%85-ide-%E6%8F%92%E4%BB%B6)
### [IDE 的选择](https://nextdevkit.com/zh/docs/pre#ide-%E7%9A%84%E9%80%89%E6%8B%A9)
在选择 IDE 的时候，你可以按照你的习惯来，由于作者是主要使用 
以下推荐的 IDE 插件，都是基于 
在 clone 代码后，你需要安装一些 IDE 插件，以便于你进行代码的开发和 lint 等。
必装并不意味着你没有这个插件无法开发，而是有了这个插件可以极大程度提高你的开发效率。
### [必装插件](https://nextdevkit.com/zh/docs/pre#%E5%BF%85%E8%A3%85%E6%8F%92%E4%BB%B6)
  * Biome(biomejs.biome): 一个现代的 JavaScript 和 TypeScript 代码检查器。
  * i18n-ally(Lokalise.i18n-ally): 一个 i18n 的辅助工具。


上面两个插件都默认配置在代码的 `.vscode` 目录的 `extensions.json` 文件中，所以你使用 VSCode 打开代码后，会自动弹出推荐安装这两个插件。只需要你点击安装即可。如果没有弹出或者没看到，你只需要手动搜索插件名称，然后点击安装即可。
### [推荐插件](https://nextdevkit.com/zh/docs/pre#%E6%8E%A8%E8%8D%90%E6%8F%92%E4%BB%B6)
  * Git Graph(mhutchie.git-graph): 一个 Git 的辅助工具，可以让你更方便的查看 Git 的提交历史和分支。
  * MDX(unifiedjs.vscode-mdx): MDX 的辅助工具，可以让你更方便的编写 MDX 文件。
  * Tailwind CSS IntelliSense(bradlc.vscode-tailwindcss): Tailwind CSS 的辅助工具，可以让你更方便的编写 Tailwind CSS 文件。
  * Git History(donjayamanne.githistory): 一个 Git 的辅助工具，可以让你更方便的查看 Git 的提交历史和分支。


### [配置保存时自动格式化](https://nextdevkit.com/zh/docs/pre#%E9%85%8D%E7%BD%AE%E4%BF%9D%E5%AD%98%E6%97%B6%E8%87%AA%E5%8A%A8%E6%A0%BC%E5%BC%8F%E5%8C%96)
为了提高开发效率，强烈建议配置 IDE 在保存文件时自动进行代码格式化。
#### [VSCode / Cursor 配置](https://nextdevkit.com/zh/docs/pre#vscode--cursor-%E9%85%8D%E7%BD%AE)
**默认 VSCode 和 Cursor 用户无需手动配置！**
NextDevKit 项目已经在 `.vscode/settings.json` 文件中预配置了自动格式化功能。当你使用 VSCode 或 Cursor 打开项目时，这些配置会自动生效。
项目中的默认配置如下：
.vscode/settings.json
```
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "javascript.preferences.importModuleSpecifier": "non-relative"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "typescript.preferences.importModuleSpecifier": "non-relative"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome",
    "typescript.preferences.importModuleSpecifier": "non-relative"
  },
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

**配置说明：**
  * `editor.formatOnSave: true`: 保存文件时自动格式化代码
  * `editor.formatOnPaste: true`: 粘贴代码时自动格式化
  * `editor.defaultFormatter: "biomejs.biome"`: 使用 Biome 作为默认格式化工具
  * `editor.codeActionsOnSave`: 保存时自动执行快速修复和整理导入
  * `importModuleSpecifier: "non-relative"`: 使用非相对路径导入模块（例如 `@/components` 而不是 `../../components`）


只需确保已安装 Biome 插件（`biomejs.biome`），保存文件时就会自动格式化代码。
## [node.js 和 pnpm](https://nextdevkit.com/zh/docs/pre#nodejs-%E5%92%8C-pnpm)
在 NextDevKit 中，我们默认使用 Nodejs v20 以上的版本作为开发环境，你也可以安装 Nodejs 的最新稳定版本。
你也可以使用 nvm 或者其他版本管理工具来管理 Nodejs 的版本。参考 
```
brew install nvm
nvm install --lts
nvm use --lts
```

使用 pnpm 作为包管理工具，你可以使用以下命令安装 pnpm。
```
npm install -g pnpm@10.10.0
```

接着安装所有依赖。
```
pnpm install
```

> 如果你 pnpm install 失败，请检查你的网络或者操作系统版本是否兼容。
## [Lint 和 Format](https://nextdevkit.com/zh/docs/pre#lint-%E5%92%8C-format)
依赖安装后，就要准备本地开发环境了。在代码开发过程中，Lint 和 Format 是两个非常重要的环节。
你可以按照 NextDevKit 的默认配置，也可以按照你自己的需求进行配置。
  * Linting（代码检查）：


分析代码中的潜在错误、bug 和代码质量问题。检查代码风格一致性、最佳实践。 例如：未使用的变量、缺少分号、使用 `==` 而不是 `===`。
  * Formatting（代码格式化）：


统一代码的外观和布局，处理缩进、换行、空格、引号等。不改变代码逻辑，只改变显示格式。
常用的 Lint 和 Format 工具有 Biome、ESLint、Prettier 等。[NextDevKit](https://nextdevkit.com) 默认集成了 Biome，并且配置了默认的 Lint 和 Format 规则。
现在的 Next.js 项目，我更推荐使用 **Biome** ，原因是：
  1. 配置简单，维护成本低。
  2. 性能更好。
  3. 一个工具解决两个问题。
  4. 与现代开发工作流集成良好。


对于已有项目，如果迁移成本不高，也建议逐步迁移到 Biome。
**优点：**
  * 一个工具同时处理 linting 和 formatting
  * 性能更快（Rust 编写）
  * 配置简单，开箱即用
  * 没有工具间的冲突问题


**缺点：**
  * 相对较新，生态还在发展
  * 自定义规则较少
  * 某些特殊需求可能不支持


### [Biome 常用配置和使用方法](https://nextdevkit.com/zh/docs/pre#biome-%E5%B8%B8%E7%94%A8%E9%85%8D%E7%BD%AE%E5%92%8C%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
在 package.json 中，使用默认已经添加的脚本命令，就可以进行 Lint 和 Format 了。
package.json
```
{
  "scripts": {
    "lint": "biome check --write .",
    "lint:fix": "biome check --fix --unsafe .",
    "format": "biome format --write .",
  }
}
```

使用以下命令进行 Lint 和 Format。
```
pnpm lint
pnpm lint:fix
pnpm format
```

### [命令对比总结](https://nextdevkit.com/zh/docs/pre#%E5%91%BD%E4%BB%A4%E5%AF%B9%E6%AF%94%E6%80%BB%E7%BB%93)
命令 | Linting | Formatting | 安全修复 | 不安全修复 | 用途  
---|---|---|---|---|---  
`pnpm lint` | ✅ | ✅ | ✅ | ❌ | 日常开发检查  
`pnpm lint:fix` | ✅ | ✅ | ✅ | ✅ | 深度清理代码  
`pnpm format` | ❌ | ✅ | ❌ | ❌ | 仅格式化  
## [Git hooks（可选）](https://nextdevkit.com/zh/docs/pre#git-hooks%E5%8F%AF%E9%80%89)
上面的 lint 和 format 命令，都需要手动执行。如果你需要在 commit 或者 push 前自动运行，那么可以参考以下 git hooks 自动运行。
因为有些小伙伴不喜欢加上 hooks 功能，所以 NextDevKit 默认没有添加 hooks 功能。
如果你是团队开发，或者需要添加 hooks 功能，可以参考以下工具：
## [配置文件](https://nextdevkit.com/zh/docs/pre#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
在设置好开发环境后，了解控制 Next.js 应用程序的核心配置文件非常重要。
### [package.json](https://nextdevkit.com/zh/docs/pre#packagejson)
`package.json` 是任何 Next.js 项目的核心配置文件，定义项目元数据、依赖项和可执行脚本。
你可以首先修改项目名称和描述：
package.json
```
{
  "name": "nextdevkit",
  "version": "1.0.0",
  "description": "next.js template with authentication, payment, and more",
  "packageManager": "pnpm@10.10.0"
}
```

NextDevKit 提供了完整的开发和构建脚本集：
package.json
```
{
  "scripts": {
    // 开发相关
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    // 代码质量
    "lint": "biome check --write .",
    "lint:fix": "biome check --fix --unsafe .",
    "format": "biome format --write .",
    // 数据库操作
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### [next.config.ts](https://nextdevkit.com/zh/docs/pre#nextconfigts)
`next.config.ts` 文件配置 Next.js 构建和运行时行为。NextDevKit 默认包含现代 Web 应用程序的优化设置。
**当前 NextDevKit 的配置：**
next.config.ts
```
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const withMDX = createMDX();
const nextConfig: NextConfig = {
	// output: "standalone",
	images: {
		remotePatterns: [
			{
				hostname: "**",
			},
		],
	},
};
const withNextIntl = createNextIntlPlugin();
export default withMDX(withNextIntl(nextConfig));
```

**需要注意的配置：**
  * **容器化配置** ：如果需要将项目部署到容器化环境（AWS ECS、Railway、Fly.io 等），使用 `output: "standalone"`
  * **图片域名** ：当前模板配置为 `**`，代表所有域名。仅为方便 Vibe Coding，如有安全需求请修改为指定域名
  * **图片优化** ：Vercel 平台的图片优化可能导致高昂费用，如担心费用问题可使用 `images: { unoptimized: true }` 关闭


更多配置信息可访问 
### [TypeScript 配置](https://nextdevkit.com/zh/docs/pre#typescript-%E9%85%8D%E7%BD%AE)
NextDevKit 的 TypeScript 配置确保类型安全和最佳开发体验。
tsconfig.json
```
{
	"compilerOptions": {
		"target": "ES2017",
		"lib": ["dom", "dom.iterable", "esnext"],
		"allowJs": true,
		"skipLibCheck": true,
		"strict": false,
		"noEmit": true,
		"incremental": true,
		"module": "esnext",
		"esModuleInterop": true,
		"moduleResolution": "bundler",
		"resolveJsonModule": true,
		"isolatedModules": true,
		"jsx": "preserve",
		"plugins": [
			{
				"name": "next"
			}
		],
		"paths": {
			"@/*": ["./src/*"],
			"@/public/*": ["./public/*"],
			"@/source": ["./.source"]
		}
	},
	"include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
	"exclude": ["node_modules"]
}
```

大多数情况，你只需要更改 `compilerOptions` 中的 `paths` 配置，来配置你的项目路径映射。
**路径映射的好处：**
```
// 之前（相对导入）
import Button from '../../../components/ui/button';
// 之后（带路径映射的绝对导入）
import Button from '@/components/ui/button';
```

[技术栈 了解使 NEXTDEVKIT 成为一个全面且现代的启动工具包的强大技术和工具。](https://nextdevkit.com/zh/docs/tech-stack)[集成 AI 工具 本教程将帮助你快速上手 NEXTDEVKIT 配合 AI IDE 使用，包括 AI Rules 和 MCP 的安装和使用。](https://nextdevkit.com/zh/docs/ai-agents)
[](https://nextdevkit.com/zh/docs/pre#%E7%AE%A1%E7%90%86%E4%BB%A3%E7%A0%81%E4%BB%93%E5%BA%93)[](https://nextdevkit.com/zh/docs/pre#%E6%96%B9%E5%BC%8F%E4%B8%80fork-%E4%BB%93%E5%BA%93%E4%BB%85%E9%80%82%E7%94%A8%E4%BA%8E%E5%8D%95%E9%A1%B9%E7%9B%AE)[](https://nextdevkit.com/zh/docs/pre#%E6%96%B9%E5%BC%8F%E4%BA%8Cclone--%E6%89%8B%E5%8A%A8%E5%88%9B%E5%BB%BA%E6%96%B0%E4%BB%93%E5%BA%93%E6%8E%A8%E8%8D%90%E7%94%A8%E4%BA%8E%E5%A4%9A%E9%A1%B9%E7%9B%AE)[](https://nextdevkit.com/zh/docs/pre#%E6%96%B9%E5%BC%8F%E4%B8%89%E4%BD%BF%E7%94%A8-github-cli%E6%9C%80%E4%BE%BF%E6%8D%B7%E6%8E%A8%E8%8D%90)[](https://nextdevkit.com/zh/docs/pre#%E9%87%8D%E8%A6%81%E6%8F%90%E9%86%92)[](https://nextdevkit.com/zh/docs/pre#clone-%E4%BB%A3%E7%A0%81%E9%80%82%E7%94%A8%E4%BA%8E%E6%96%B9%E5%BC%8F%E4%B8%80%E5%92%8C%E6%96%B9%E5%BC%8F%E4%BA%8C)[](https://nextdevkit.com/zh/docs/pre#https-%E6%96%B9%E5%BC%8F)[](https://nextdevkit.com/zh/docs/pre#ssh-%E6%96%B9%E5%BC%8F)[](https://nextdevkit.com/zh/docs/pre#%E5%AE%89%E8%A3%85-ide-%E6%8F%92%E4%BB%B6)[](https://nextdevkit.com/zh/docs/pre#ide-%E7%9A%84%E9%80%89%E6%8B%A9)[](https://nextdevkit.com/zh/docs/pre#%E5%BF%85%E8%A3%85%E6%8F%92%E4%BB%B6)[](https://nextdevkit.com/zh/docs/pre#%E6%8E%A8%E8%8D%90%E6%8F%92%E4%BB%B6)[](https://nextdevkit.com/zh/docs/pre#%E9%85%8D%E7%BD%AE%E4%BF%9D%E5%AD%98%E6%97%B6%E8%87%AA%E5%8A%A8%E6%A0%BC%E5%BC%8F%E5%8C%96)[](https://nextdevkit.com/zh/docs/pre#vscode--cursor-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/pre#nodejs-%E5%92%8C-pnpm)[](https://nextdevkit.com/zh/docs/pre#lint-%E5%92%8C-format)[](https://nextdevkit.com/zh/docs/pre#biome-%E5%B8%B8%E7%94%A8%E9%85%8D%E7%BD%AE%E5%92%8C%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)[](https://nextdevkit.com/zh/docs/pre#%E5%91%BD%E4%BB%A4%E5%AF%B9%E6%AF%94%E6%80%BB%E7%BB%93)[](https://nextdevkit.com/zh/docs/pre#git-hooks%E5%8F%AF%E9%80%89)[](https://nextdevkit.com/zh/docs/pre#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)[](https://nextdevkit.com/zh/docs/pre#packagejson)[](https://nextdevkit.com/zh/docs/pre#nextconfigts)[](https://nextdevkit.com/zh/docs/pre#typescript-%E9%85%8D%E7%BD%AE)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
![fork-clone](https://nextdevkit.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ftutorials-pre-fork-clone.6818a9d8.png&w=828&q=75)
