# 来源: https://nextdevkit.com/zh/docs/i18n

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
国际化多语言支持🤔 什么是 Next-intl？
# 国际化多语言支持
学习如何在 NEXTDEVKIT 中使用 next-intl 实现多语言支持
> NextDevKit 使用 **next-intl** 构建国际化系统，提供自动路由、类型安全和无缝多语言支持。
国际化（i18n）是现代全球化应用不可缺少的功能。NextDevKit 内置了基于 next-intl 的现代化国际化系统，让你轻松实现多语言支持。
## [🤔 什么是 Next-intl？](https://nextdevkit.com/zh/docs/i18n#-%E4%BB%80%E4%B9%88%E6%98%AF-next-intl)
**next-intl** 是专为 Next.js 设计的国际化库：
  * **🎯 Next.js 优化** ：完美集成 App Router 和 Pages Router
  * **🔒 类型安全** ：TypeScript 支持，编译时检查翻译键
  * **🌍 自动路由** ：基于语言的 URL 路由管理
  * **🍪 智能检测** ：浏览器语言 + Cookie 偏好设置
  * **🚀 高性能** ：服务端渲染 + 消息合并优化


## [🏗️ 国际化架构](https://nextdevkit.com/zh/docs/i18n#%EF%B8%8F-%E5%9B%BD%E9%99%85%E5%8C%96%E6%9E%B6%E6%9E%84)
### [项目结构](https://nextdevkit.com/zh/docs/i18n#%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84)
**核心组件说明** ：
  * **`src/i18n/`**：国际化核心配置和工具
  * **`messages/`**：存放所有语言的翻译文件
  * **`app/[locale]/`**：基于语言的路由结构
  * **`middleware.ts`**：语言检测和重定向中间件


## [⚙️ 配置与初始化](https://nextdevkit.com/zh/docs/i18n#%EF%B8%8F-%E9%85%8D%E7%BD%AE%E4%B8%8E%E5%88%9D%E5%A7%8B%E5%8C%96)
### [应用配置](https://nextdevkit.com/zh/docs/i18n#%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE)
在 `src/config/index.ts` 中统一管理国际化配置：
src/config/index.ts
```
export const appConfig = {
  i18n: {
    enabled: true,                    // 启用/禁用国际化
    defaultLocale: "en",              // 默认语言
    locales: {                        // 支持的语言
      en: { name: "English" },
      zh: { name: "简体中文" },
    },
    localeCookieName: "NEXT_LOCALE",  // Cookie 名称
  },
  // ... 其他配置
} as const;
```

**配置说明** ：
  * **`enabled`**：全局开关，可以快速禁用国际化
  * **`defaultLocale`**：默认语言，用于回退和首次访问
  * **`locales`**：语言映射，键为语言代码，值为显示名称
  * **`localeCookieName`**：存储用户语言偏好的 Cookie 名称


### [路由配置](https://nextdevkit.com/zh/docs/i18n#%E8%B7%AF%E7%94%B1%E9%85%8D%E7%BD%AE)
`src/i18n/routing.ts` 定义了 next-intl 的路由行为：
src/i18n/routing.ts
```
import { appConfig } from "@/config";
import { defineRouting } from "next-intl/routing";
export const routing = defineRouting({
  locales: Object.keys(appConfig.i18n.locales),    // ['en', 'zh']
  defaultLocale: appConfig.i18n.defaultLocale,     // 'en'
  localeCookie: {
    name: appConfig.i18n.localeCookieName,          // 'NEXT_LOCALE'
  },
  localeDetection: appConfig.i18n.enabled,         // 是否自动检测语言
  localePrefix: appConfig.i18n.enabled ? "as-needed" : "never",
});
```

**路由策略** ：
  * **`as-needed`**：仅非默认语言显示前缀（`/zh/about` ，默认语言 `/about`）
  * **`never`**：所有语言都不显示前缀
  * **`always`**：所有语言都显示前缀（`/en/about` , `/zh/about`）


## [📁 翻译消息组织](https://nextdevkit.com/zh/docs/i18n#-%E7%BF%BB%E8%AF%91%E6%B6%88%E6%81%AF%E7%BB%84%E7%BB%87)
### [消息文件结构](https://nextdevkit.com/zh/docs/i18n#%E6%B6%88%E6%81%AF%E6%96%87%E4%BB%B6%E7%BB%93%E6%9E%84)
采用嵌套结构组织翻译消息：
#### [英文消息示例](https://nextdevkit.com/zh/docs/i18n#%E8%8B%B1%E6%96%87%E6%B6%88%E6%81%AF%E7%A4%BA%E4%BE%8B)
messages/en.json
```
{
  "app": {
    "name": "NEXTDEVKIT",
    "metadata": {
      "title": "NEXTDEVKIT - Next.js SaaS Starter Kit",
      "description": "Build production-ready SaaS apps faster..."
    }
  },
  "menu": {
    "application": {
      "dashboard": {
        "title": "Dashboard"
      }
    },
    "settings": {
      "title": "Settings"
    }
  },
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "email": "Email address",
      "password": "Password",
      "submit": "Sign in"
    }
  }
}
```

#### [中文消息示例](https://nextdevkit.com/zh/docs/i18n#%E4%B8%AD%E6%96%87%E6%B6%88%E6%81%AF%E7%A4%BA%E4%BE%8B)
messages/zh.json
```
{
  "app": {
    "name": "NEXTDEVKIT",
    "metadata": {
      "title": "NEXTDEVKIT - Next.js SaaS 开发模板",
      "description": "更快构建和部署生产级 SaaS 应用..."
    }
  },
  "menu": {
    "application": {
      "dashboard": {
        "title": "仪表板"
      }
    },
    "settings": {
      "title": "设置"
    }
  },
  "auth": {
    "login": {
      "title": "登录您的账户",
      "email": "电子邮箱",
      "password": "密码",
      "submit": "登录"
    }
  }
}
```

### [组织策略](https://nextdevkit.com/zh/docs/i18n#%E7%BB%84%E7%BB%87%E7%AD%96%E7%95%A5)
**按功能模块分组** ：
  * **`app`**：应用级别信息
  * **`common`**：通用词汇
  * **`auth`**：认证相关
  * **`menu`**：导航菜单
  * **`settings`**：设置页面


**命名约定** ：
  * 使用 **驼峰命名** ：`firstName` 而不是 `first_name`
  * **语义化命名** ：`submitButton` 而不是 `btn1`
  * **分层结构** ：`auth.login.title` 而不是 `authLoginTitle`


## [🎨 在组件中使用](https://nextdevkit.com/zh/docs/i18n#-%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8)
### [服务端组件](https://nextdevkit.com/zh/docs/i18n#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%BB%84%E4%BB%B6)
src/app/[locale]/(marketing)/page.tsx
```
import { getTranslations } from "next-intl/server";
export default async function HomePage() {
  const t = await getTranslations("app.metadata");
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### [客户端组件](https://nextdevkit.com/zh/docs/i18n#%E5%AE%A2%E6%88%B7%E7%AB%AF%E7%BB%84%E4%BB%B6)
src/components/auth/login-form.tsx
```
'use client';
import { useTranslations } from "next-intl";
export function LoginForm() {
  const t = useTranslations("auth.login");
  return (
    <form>
      <h2>{t("title")}</h2>
      <input
        type="email"
        placeholder={t("email")}
      />
      <input
        type="password"
        placeholder={t("password")}
      />
      <button type="submit">
        {t("submit")}
      </button>
    </form>
  );
}
```

## [🧭 国际化导航](https://nextdevkit.com/zh/docs/i18n#-%E5%9B%BD%E9%99%85%E5%8C%96%E5%AF%BC%E8%88%AA)
### [使用 Link 组件](https://nextdevkit.com/zh/docs/i18n#%E4%BD%BF%E7%94%A8-link-%E7%BB%84%E4%BB%B6)
NextDevKit 提供的 `Link` 组件会自动处理语言路由：
src/components/shared/header/index.tsx
```
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
export function Header() {
  const t = useTranslations("menu");
  return (
    <nav>
      {/* 基础用法 - 自动添加语言前缀 */}
      <Link href="/">首页</Link>
      <Link href="/blog">博客</Link>
      <Link href="/docs">文档</Link>
      {/* 使用翻译文本 */}
      <Link href="/app/dashboard">
        {t("application.dashboard.title")}
      </Link>
    </nav>
  );
}
```

### [Link 组件特性](https://nextdevkit.com/zh/docs/i18n#link-%E7%BB%84%E4%BB%B6%E7%89%B9%E6%80%A7)
**自动语言前缀** ：
```
// 当前语言为 zh 时
<Link href="/about">关于</Link>
// 渲染为: <a href="/zh/about">关于</a>
// 当前语言为 en（默认语言）时
<Link href="/about">About</Link>
// 渲染为: <a href="/about">About</a>
```

**编程式导航** ：
```
'use client';
import { useRouter, usePathname } from "@/i18n/navigation";
export function NavigationExample() {
  const router = useRouter();
  const pathname = usePathname();
  const handleNavigation = () => {
    // 导航到其他页面
    router.push('/dashboard');
    // 带查询参数导航
    router.push('/search?q=nextjs');
    // 替换当前历史记录
    router.replace('/new-page');
    // 返回上一页
    router.back();
  };
  return (
    <div>
      <p>当前路径: {pathname}</p>
      <button onClick={handleNavigation}>导航</button>
    </div>
  );
}
```

**服务端重定向** ：
```
import { redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
export default async function ProtectedPage() {
  const session = await getSession();
  if (!session) {
    // 自动添加语言前缀进行重定向
    redirect('/auth/login');
  }
  return <div>受保护的内容</div>;
}
```

### [中间件配置](https://nextdevkit.com/zh/docs/i18n#%E4%B8%AD%E9%97%B4%E4%BB%B6%E9%85%8D%E7%BD%AE)
middleware.ts
```
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
export default createMiddleware(routing);
export const config = {
  // 匹配所有路径，除了 api、_next/static、_next/image 和文件扩展名
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"]
};
```

## [🔧 添加新语言](https://nextdevkit.com/zh/docs/i18n#-%E6%B7%BB%E5%8A%A0%E6%96%B0%E8%AF%AD%E8%A8%80)
### [1. 创建翻译文件](https://nextdevkit.com/zh/docs/i18n#1-%E5%88%9B%E5%BB%BA%E7%BF%BB%E8%AF%91%E6%96%87%E4%BB%B6)
在 `messages/` 目录创建新语言文件：
messages/ja.json
```
{
  "app": {
    "name": "NEXTDEVKIT",
    "metadata": {
      "title": "NEXTDEVKIT - Next.js SaaS スターターキット",
      "description": "より高速にプロダクション対応のSaaSアプリを構築..."
    }
  },
  "auth": {
    "login": {
      "title": "アカウントにサインイン",
      "email": "メールアドレス",
      "password": "パスワード",
      "submit": "サインイン"
    }
  }
}
```

### [2. 更新应用配置](https://nextdevkit.com/zh/docs/i18n#2-%E6%9B%B4%E6%96%B0%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE)
src/config/index.ts
```
export const appConfig = {
  i18n: {
    enabled: true,
    defaultLocale: "en",
    locales: {
      en: { name: "English" },
      zh: { name: "简体中文" },
      ja: { name: "日本語" },  // 添加日语
    },
    localeCookieName: "NEXT_LOCALE",
  },
} as const;
```

### [3. 测试新语言](https://nextdevkit.com/zh/docs/i18n#3-%E6%B5%8B%E8%AF%95%E6%96%B0%E8%AF%AD%E8%A8%80)
启动开发服务器并访问：
  * `/` (默认语言)
  * `/zh` (中文)
  * `/ja` (日语)


## [📚 最佳实践](https://nextdevkit.com/zh/docs/i18n#-%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)
### [翻译键命名规范](https://nextdevkit.com/zh/docs/i18n#%E7%BF%BB%E8%AF%91%E9%94%AE%E5%91%BD%E5%90%8D%E8%A7%84%E8%8C%83)
```
// ✅ 好的命名
t("auth.login.submitButton")
t("common.confirmDialog.title") 
t("dashboard.metrics.totalUsers")
// ❌ 避免的命名
t("button1")
t("text_for_login")
t("authLoginSubmitButtonText")
```

## [🔗 相关资源](https://nextdevkit.com/zh/docs/i18n#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
[如何组织和创建文档 学习如何在 NEXTDEVKIT 中使用 Fumadocs 创建和管理文档](https://nextdevkit.com/zh/docs/documentation)[支付概述 学习如何在 NEXTDEVKIT 中使用 Stripe 或 Creem 设置和使用支付](https://nextdevkit.com/zh/docs/payment)
[](https://nextdevkit.com/zh/docs/i18n#-%E4%BB%80%E4%B9%88%E6%98%AF-next-intl)[](https://nextdevkit.com/zh/docs/i18n#%EF%B8%8F-%E5%9B%BD%E9%99%85%E5%8C%96%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/i18n#%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/i18n#%EF%B8%8F-%E9%85%8D%E7%BD%AE%E4%B8%8E%E5%88%9D%E5%A7%8B%E5%8C%96)[](https://nextdevkit.com/zh/docs/i18n#%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/i18n#%E8%B7%AF%E7%94%B1%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/i18n#-%E7%BF%BB%E8%AF%91%E6%B6%88%E6%81%AF%E7%BB%84%E7%BB%87)[](https://nextdevkit.com/zh/docs/i18n#%E6%B6%88%E6%81%AF%E6%96%87%E4%BB%B6%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/i18n#%E8%8B%B1%E6%96%87%E6%B6%88%E6%81%AF%E7%A4%BA%E4%BE%8B)[](https://nextdevkit.com/zh/docs/i18n#%E4%B8%AD%E6%96%87%E6%B6%88%E6%81%AF%E7%A4%BA%E4%BE%8B)[](https://nextdevkit.com/zh/docs/i18n#%E7%BB%84%E7%BB%87%E7%AD%96%E7%95%A5)[](https://nextdevkit.com/zh/docs/i18n#-%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8)[](https://nextdevkit.com/zh/docs/i18n#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/i18n#%E5%AE%A2%E6%88%B7%E7%AB%AF%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/i18n#-%E5%9B%BD%E9%99%85%E5%8C%96%E5%AF%BC%E8%88%AA)[](https://nextdevkit.com/zh/docs/i18n#%E4%BD%BF%E7%94%A8-link-%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/i18n#link-%E7%BB%84%E4%BB%B6%E7%89%B9%E6%80%A7)[](https://nextdevkit.com/zh/docs/i18n#%E4%B8%AD%E9%97%B4%E4%BB%B6%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/i18n#-%E6%B7%BB%E5%8A%A0%E6%96%B0%E8%AF%AD%E8%A8%80)[](https://nextdevkit.com/zh/docs/i18n#1-%E5%88%9B%E5%BB%BA%E7%BF%BB%E8%AF%91%E6%96%87%E4%BB%B6)[](https://nextdevkit.com/zh/docs/i18n#2-%E6%9B%B4%E6%96%B0%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/i18n#3-%E6%B5%8B%E8%AF%95%E6%96%B0%E8%AF%AD%E8%A8%80)[](https://nextdevkit.com/zh/docs/i18n#-%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)[](https://nextdevkit.com/zh/docs/i18n#%E7%BF%BB%E8%AF%91%E9%94%AE%E5%91%BD%E5%90%8D%E8%A7%84%E8%8C%83)[](https://nextdevkit.com/zh/docs/i18n#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
