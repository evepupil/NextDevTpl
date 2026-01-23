# 来源: https://nextdevkit.com/zh/docs/build-ui-components

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
构建 UI 组件Shadcn UI 组件
# 构建 UI 组件
学习如何快速构建 NextDevKit 的 UI 组件，构建你的 SaaS 项目。
上一节课我们聊了如何快速配置 NextDevKit 内置的 UI 组件，虽然说 NextDevKit 内置了很多 UI 组件，但是肯定无法满足所有人的需求，你也可以根据你的需求，快速构建你的其它 UI 组件。今天来聊一聊我一般是如何快速构建我需要的 UI 组件的。
## [Shadcn UI 组件](https://nextdevkit.com/zh/docs/build-ui-components#shadcn-ui-%E7%BB%84%E4%BB%B6)
NextDevKit 基于 Shadcn UI 来构建基础组件库，例如 `button`, `alert`, `card`, `input`, `select`, `table` 等等。在 `src/components/ui` 目录下，你可以找到所有 Shadcn UI 的组件。
但是 NextDevKit 并没有安装所有的 Shadcn UI 组件，一方面是基于打包体积考虑，另一方面还是保持按需引入的良好工程实践。
### [🚀 如何在 NextDevKit 中添加 Shadcn UI 组件](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%A6%82%E4%BD%95%E5%9C%A8-nextdevkit-%E4%B8%AD%E6%B7%BB%E5%8A%A0-shadcn-ui-%E7%BB%84%E4%BB%B6)
由于 NextDevKit 已经配置好了 Shadcn UI 的基础配置，所以你只需要根据你的需求，添加你需要的组件即可。
```
# 添加单个组件
npx shadcn@latest add button
# 一次性添加多个常用组件
npx shadcn@latest add card dialog sheet table dropdown-menu
```

#### [在项目中使用组件](https://nextdevkit.com/zh/docs/build-ui-components#%E5%9C%A8%E9%A1%B9%E7%9B%AE%E4%B8%AD%E4%BD%BF%E7%94%A8%E7%BB%84%E4%BB%B6)
```
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
```

## [🧱 内置组件](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%86%85%E7%BD%AE%E7%BB%84%E4%BB%B6)
除了 Shadcn UI 的基础组件之外，NextDevKit 还为你准备了丰富的内置组件，涵盖了 SaaS 应用的各个方面：
### [🔐 认证组件 (`/auth/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E8%AE%A4%E8%AF%81%E7%BB%84%E4%BB%B6-auth)
完整的用户认证流程组件：
  * `login-form` - 登录表单
  * `signup-form` - 注册表单
  * `forgot-password-form` - 忘记密码表单
  * `reset-password-form` - 重置密码表单
  * `social-signin` - 社交登录按钮组合


### [📊 仪表板组件 (`/dashboard/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%BB%AA%E8%A1%A8%E6%9D%BF%E7%BB%84%E4%BB%B6-dashboard)
管理后台必需的布局组件：
  * `dashboard-header` - 仪表板顶部导航
  * `dashboard-sidebar-menu` - 侧边栏菜单
  * `dashboard-sidebar-user` - 用户信息展示
  * `sidebar` - 可折叠侧边栏


### [🎯 营销组件 (`/marketing/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E8%90%A5%E9%94%80%E7%BB%84%E4%BB%B6-marketing)
构建营销页面的专业组件：
  * **首页组件** ：`hero-section`（英雄区块）, `feature-section`（功能展示）
  * **商业组件** ：`pricing`（定价表）, `testimonials`（用户评价）
  * **互动组件** ：`contact-form`（联系表单）, `faq`（常见问题）
  * **内容组件** ：`changelog`（更新日志）, `affiliate`（联盟推广）


### [⚙️ 设置组件 (`/settings/`)](https://nextdevkit.com/zh/docs/build-ui-components#%EF%B8%8F-%E8%AE%BE%E7%BD%AE%E7%BB%84%E4%BB%B6-settings)
用户设置页面的完整组件套装：
  * **账户管理** ：头像修改、姓名邮箱修改、语言切换、账户删除
  * **安全设置** ：密码修改、社交账号绑定
  * **订阅管理** ：支付方式管理、邮件订阅设置


### [🌐 共享组件 (`/shared/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%85%B1%E4%BA%AB%E7%BB%84%E4%BB%B6-shared)
跨页面使用的通用组件：
  * **布局组件** ：`header`（头部导航）, `footer`（页脚）
  * **功能组件** ：`theme-switcher`（主题切换）, `locale-switcher`（语言切换）
  * **表单组件** ：`newsletter-subscriber`（邮件订阅）, `cookie-consent`（Cookie 同意）
  * **业务组件** ：`user-avatar`（用户头像）, `providers`（全局提供者）


### [🎨 图标组件 (`/icons/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%9B%BE%E6%A0%87%E7%BB%84%E4%BB%B6-icons)
精心设计的图标集合：
  * **社交媒体图标** ：`github`, `google`, `discord`, `x`, `linkedin` 等平台
  * **品牌图标** ：`logo`（站点 Logo）, `not-found`（404 图标）


### [💡 示例组件 (`/examples/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E7%A4%BA%E4%BE%8B%E7%BB%84%E4%BB%B6-examples)
展示高级功能的示例组件：
  * **AI 功能** ：聊天界面、图像生成、语音输入
  * **仪表板示例** ：数据统计、用户卡片、设置表单等 11 个实用示例


### [📝 专项组件](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%B8%93%E9%A1%B9%E7%BB%84%E4%BB%B6)
  * **管理员组件** (`/admin/`)：用户管理表格
  * **博客组件** (`/blog/`)：MDX 支持、目录生成、返回顶部
  * **文档组件** (`/docs/`)：技术文档


这些内置组件都已经过精心设计和测试，符合响应式和国际化，并且在移动端响应式也非常友好，可以直接在你的项目中使用，大大加速开发效率！
#### [🌐 相关网站详细信息](https://nextdevkit.com/zh/docs/build-ui-components#-%E7%9B%B8%E5%85%B3%E7%BD%91%E7%AB%99%E8%AF%A6%E7%BB%86%E4%BF%A1%E6%81%AF)
**官方资源：**
## [🌟 社区里优秀的组件库](https://nextdevkit.com/zh/docs/build-ui-components#-%E7%A4%BE%E5%8C%BA%E9%87%8C%E4%BC%98%E7%A7%80%E7%9A%84%E7%BB%84%E4%BB%B6%E5%BA%93)
除了 Shadcn UI 本身的基础组件库之外，社区还有很多优秀的可以兼容 Shadcn UI 的组件库和资源，可以帮助你快速构建现代化的 UI，以下都是我常用的一些参考组件库，NextDevKit 也是基于这些开源免费的组件库来构建的：
### [🎨 免费组件库](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%85%8D%E8%B4%B9%E7%BB%84%E4%BB%B6%E5%BA%93)
**动画和交互组件：**
**综合组件库：**
### [🔧 专业工具库](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%B8%93%E4%B8%9A%E5%B7%A5%E5%85%B7%E5%BA%93)
**富文本编辑器：**
**用户引导工具：**
**图标库：**
### [📚 资源和集合](https://nextdevkit.com/zh/docs/build-ui-components#-%E8%B5%84%E6%BA%90%E5%92%8C%E9%9B%86%E5%90%88)
如果你还需要找到更多的免费社区 Shadcn UI 的组件，可以参考以下资源：
### [💰 付费高级组件](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%BB%98%E8%B4%B9%E9%AB%98%E7%BA%A7%E7%BB%84%E4%BB%B6)
如果需要更专业的组件和支持，可以考虑以下付费选项：
[Landing Page 启动配置 从最小启动到完整配置的渐进式指南，帮助你快速启动和定制 NEXTDEVKIT Landing Page。](https://nextdevkit.com/zh/docs/project-landing)[如何选择和使用数据库 学习如何选择和使用 NextDevKit 的数据库代码，快速搭建你的业务模型。](https://nextdevkit.com/zh/docs/database)
[](https://nextdevkit.com/zh/docs/build-ui-components#shadcn-ui-%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%A6%82%E4%BD%95%E5%9C%A8-nextdevkit-%E4%B8%AD%E6%B7%BB%E5%8A%A0-shadcn-ui-%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/build-ui-components#%E5%9C%A8%E9%A1%B9%E7%9B%AE%E4%B8%AD%E4%BD%BF%E7%94%A8%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%86%85%E7%BD%AE%E7%BB%84%E4%BB%B6)[`/auth/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E8%AE%A4%E8%AF%81%E7%BB%84%E4%BB%B6-auth)[`/dashboard/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%BB%AA%E8%A1%A8%E6%9D%BF%E7%BB%84%E4%BB%B6-dashboard)[`/marketing/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E8%90%A5%E9%94%80%E7%BB%84%E4%BB%B6-marketing)[`/settings/`)](https://nextdevkit.com/zh/docs/build-ui-components#%EF%B8%8F-%E8%AE%BE%E7%BD%AE%E7%BB%84%E4%BB%B6-settings)[`/shared/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%85%B1%E4%BA%AB%E7%BB%84%E4%BB%B6-shared)[`/icons/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%9B%BE%E6%A0%87%E7%BB%84%E4%BB%B6-icons)[`/examples/`)](https://nextdevkit.com/zh/docs/build-ui-components#-%E7%A4%BA%E4%BE%8B%E7%BB%84%E4%BB%B6-examples)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%B8%93%E9%A1%B9%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E7%9B%B8%E5%85%B3%E7%BD%91%E7%AB%99%E8%AF%A6%E7%BB%86%E4%BF%A1%E6%81%AF)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E7%A4%BE%E5%8C%BA%E9%87%8C%E4%BC%98%E7%A7%80%E7%9A%84%E7%BB%84%E4%BB%B6%E5%BA%93)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E5%85%8D%E8%B4%B9%E7%BB%84%E4%BB%B6%E5%BA%93)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%B8%93%E4%B8%9A%E5%B7%A5%E5%85%B7%E5%BA%93)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E8%B5%84%E6%BA%90%E5%92%8C%E9%9B%86%E5%90%88)[](https://nextdevkit.com/zh/docs/build-ui-components#-%E4%BB%98%E8%B4%B9%E9%AB%98%E7%BA%A7%E7%BB%84%E4%BB%B6)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
