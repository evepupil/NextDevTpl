# 来源: https://nextdevkit.com/zh/docs/authentication/user-session

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)
[](https://nextdevkit.com/zh/docs/authentication)[](https://nextdevkit.com/zh/docs/authentication/user-session)
[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
获取 session 信息如何使用
注册登录鉴权指南
# 获取 session 信息
学习如何在 NEXTDEVKIT 中使用用户会话
## [如何使用](https://nextdevkit.com/zh/docs/authentication/user-session#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8)
在配置完成 NextDevKit 的 Auth 配置后，你就可以开始学习如何使用对应的内置方法来获取用户信息。
我们这里不会深入了解 NextDevKit 是如何实现 login, signup, forgot password 等功能的，对应的代码你可以参考：
  * login - `src/components/auth/login-form.tsx`
  * signup - `src/components/auth/signup-form.tsx`
  * forgot password - `src/components/auth/forgot-password-form.tsx`
  * reset password - `src/components/auth/reset-password-form.tsx`
  * social signin - `src/components/auth/social-signin.tsx`


如果你有更加复杂的登录注册流程，也可以根据已有的代码继续扩展。
### [如何获取用户信息](https://nextdevkit.com/zh/docs/authentication/user-session#%E5%A6%82%E4%BD%95%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF)
我们这里更多的是要介绍如何使用 NextDevKit 的 Auth 功能来获取用户信息，判断用户的 session 和是否登录等。
大部分的业务里面，你都需要至少两个 auth 相关的功能
  1. 判断用户是否登录来决定是否展示对应的功能。
  2. 获取用户信息来展示对应的用户信息。


NextDevKit 已经默认配置好了对应的 `useSession` 的 hook 来获取用户信息和判断用户是否登录。
NextDevKit 提供了多种获取用户认证信息的方法，它们适用于不同的使用场景。作为模板使用者，理解什么时候使用哪种方法非常重要。让我来详细介绍每种方法的用途和最佳实践。
### [1. 客户端组件中使用认证信息](https://nextdevkit.com/zh/docs/authentication/user-session#1-%E5%AE%A2%E6%88%B7%E7%AB%AF%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%AE%A4%E8%AF%81%E4%BF%A1%E6%81%AF)
#### [useSession Hook（推荐方式）](https://nextdevkit.com/zh/docs/authentication/user-session#usesession-hook%E6%8E%A8%E8%8D%90%E6%96%B9%E5%BC%8F)
这是客户端组件中获取用户信息的主要方法，它基于 React Context 和 React Query。
例如我们要实现一个用户信息展示的组件，我们可以使用 `useSession` 来获取用户信息 (下面的代码只是示例，并没有在模板中实现)
src/components/auth/user-profile.tsx
```
"use client";
import { useSession } from "@/lib/hooks/use-session";
export function UserProfile() {
	const { user, session, loaded, reloadSession } = useSession();
	// 显示加载骨架屏，避免闪烁
	if (!loaded) {
		return <Skeleton className="h-10 w-full" />;
	}
	// 用户未登录
	if (!user || !session) {
		return redirect("/auth/login");
	}
	// 用户已登录
	return (
		<div>
			<h1>Welcome, {user.name}!</h1>
			<p>Email: {user.email}</p>
			<p>Locale: {user.locale}</p>
			{/* 需要重新加载 session 时调用 */}
			<button onClick={() => reloadSession()}>
				Refresh Session
			</button>
		</div>
	);
}
```

**何时使用 useSession：**
  * ✅ 在客户端组件中需要用户信息时
  * ❌ 不要在服务端组件中使用


**重要注意事项：**
  * 始终先检查 `loaded` 状态，避免闪烁效果
  * 检查 `user` 和 `session` 是否存在再使用
  * 在用户信息更新后调用 `reloadSession()` 刷新状态，避免用户信息过期


#### [直接使用 authClient（高级用法）](https://nextdevkit.com/zh/docs/authentication/user-session#%E7%9B%B4%E6%8E%A5%E4%BD%BF%E7%94%A8-authclient%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95)
如果你需要更多控制或进行认证相关的操作，可以直接使用 authClient：
```
"use client";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
const handleLogout = async () => {
  try {
    await authClient.signOut();
    router.push("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
```

**何时使用 authClient：**
  * ✅ 执行登录、注册、登出等操作时
  * ✅ 需要调用特定的认证 API 时
  * ✅ 需要更细粒度的错误处理时
  * ✅ **不希望 React Query 来管理认证状态时**


### [2. 服务端组件中使用认证信息](https://nextdevkit.com/zh/docs/authentication/user-session#2-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%AE%A4%E8%AF%81%E4%BF%A1%E6%81%AF)
#### [getSession 函数（服务端专用）](https://nextdevkit.com/zh/docs/authentication/user-session#getsession-%E5%87%BD%E6%95%B0%E6%9C%8D%E5%8A%A1%E7%AB%AF%E4%B8%93%E7%94%A8)
在服务端组件、服务端动作、API 路由中使用这个方法获取用户信息：
**在 Server Actions 中使用：**
src/lib/actions/user-actions.ts
```
"use server";
import { getSession } from "@/lib/auth/server";
const session = await getSession();
if (!session?.user) {
  throw new Error("Unauthorized");
}
```

**何时使用 getSession：**
  * ✅ 在服务端组件中需要用户信息时
  * ✅ 在服务端动作（Server Actions）中需要验证用户身份时
  * ✅ 在 API 路由中需要获取当前用户信息时
  * ❌ 不要在客户端组件中使用


### [3. Edge 运行时中使用认证信息](https://nextdevkit.com/zh/docs/authentication/user-session#3-edge-%E8%BF%90%E8%A1%8C%E6%97%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%AE%A4%E8%AF%81%E4%BF%A1%E6%81%AF)
#### [Edge getSession（中间件和Edge函数专用）](https://nextdevkit.com/zh/docs/authentication/user-session#edge-getsession%E4%B8%AD%E9%97%B4%E4%BB%B6%E5%92%8Cedge%E5%87%BD%E6%95%B0%E4%B8%93%E7%94%A8)
在 middleware.ts 或其他 Edge 运行时环境中使用：
src/middleware.ts
```
import { getSession } from "@/lib/auth/edge";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export async function middleware(request: NextRequest) {
	const session = await getSession(request);
	// 保护特定路由
	if (request.nextUrl.pathname.startsWith("/app")) {
		if (!session?.user) {
			const loginUrl = new URL("/auth/login", request.url);
			loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
			return NextResponse.redirect(loginUrl);
		}
	}
	return NextResponse.next();
}
export const config = {
	matcher: ["/app/:path*"]
};
```

**何时使用 Edge getSession：**
  * ✅ 在 middleware.ts 中需要验证用户身份时
  * ✅ 在 Edge API 路由中需要获取用户信息时
  * ✅ 在边缘计算环境中需要认证信息时
  * ✅ 最新 Next.js 版本更新 nodejs middleware 后也可以使用 server getSession 来实现


### [使用场景总结表](https://nextdevkit.com/zh/docs/authentication/user-session#%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF%E6%80%BB%E7%BB%93%E8%A1%A8)
使用场景 | 推荐方法 | 原因  
---|---|---  
客户端组件获取用户信息 | `useSession()` | 提供加载状态和重载功能  
客户端执行认证操作 | `authClient` | 直接访问认证 API  
服务端组件保护路由 | `getSession()` | 服务端专用，性能好  
服务端动作验证身份 | `getSession()` | 安全的服务端验证  
中间件路由保护 | Edge `getSession()` | Edge 运行时兼容  
### [常见错误和解决方案](https://nextdevkit.com/zh/docs/authentication/user-session#%E5%B8%B8%E8%A7%81%E9%94%99%E8%AF%AF%E5%92%8C%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
#### [1. "useSession must be used within SessionProvider" 错误](https://nextdevkit.com/zh/docs/authentication/user-session#1-usesession-must-be-used-within-sessionprovider-%E9%94%99%E8%AF%AF)
**原因：** 在没有 SessionProvider 包裹的组件中使用了 `useSession`
**解决：** 确保你的应用被正确的 Provider 包裹，检查 `layout.tsx`
#### [2. 服务端组件中使用客户端钩子](https://nextdevkit.com/zh/docs/authentication/user-session#2-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%92%A9%E5%AD%90)
```
// ❌ 错误 - 在服务端组件中使用客户端钩子
export default function ServerComponent() {
	const { user } = useSession(); // 这会报错
	return <div>{user?.name}</div>;
}
// ✅ 正确 - 使用服务端方法
export default async function ServerComponent() {
	const session = await getSession();
	return <div>{session?.user?.name}</div>;
}
```

#### [3. 中间件中使用错误的 getSession](https://nextdevkit.com/zh/docs/authentication/user-session#3-%E4%B8%AD%E9%97%B4%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E9%94%99%E8%AF%AF%E7%9A%84-getsession)
```
// ❌ 错误 - 在中间件中使用服务端方法，会导致连接数据库失败
import { getSession } from "@/lib/auth/server"; // 错误导入
// ✅ 正确 - 使用 Edge 版本
import { getSession } from "@/lib/auth/edge";
```

通过遵循这些指导原则，你可以在 NextDevKit 中正确高效地使用认证系统。记住始终根据你的使用环境选择合适的方法，并注意处理加载状态和错误情况。
[概述 学习如何在 NEXTDEVKIT 中使用 Better Auth 设置和使用身份验证](https://nextdevkit.com/zh/docs/authentication)[如何发送邮件 深入学习如何在 NextDevKit 中使用 Resend + React Email 发送邮件和管理 Newsletter，掌握邮件系统的完整功能。](https://nextdevkit.com/zh/docs/email)
[](https://nextdevkit.com/zh/docs/authentication/user-session#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8)[](https://nextdevkit.com/zh/docs/authentication/user-session#%E5%A6%82%E4%BD%95%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF)[](https://nextdevkit.com/zh/docs/authentication/user-session#1-%E5%AE%A2%E6%88%B7%E7%AB%AF%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%AE%A4%E8%AF%81%E4%BF%A1%E6%81%AF)[](https://nextdevkit.com/zh/docs/authentication/user-session#usesession-hook%E6%8E%A8%E8%8D%90%E6%96%B9%E5%BC%8F)[](https://nextdevkit.com/zh/docs/authentication/user-session#%E7%9B%B4%E6%8E%A5%E4%BD%BF%E7%94%A8-authclient%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95)[](https://nextdevkit.com/zh/docs/authentication/user-session#2-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%AE%A4%E8%AF%81%E4%BF%A1%E6%81%AF)[](https://nextdevkit.com/zh/docs/authentication/user-session#getsession-%E5%87%BD%E6%95%B0%E6%9C%8D%E5%8A%A1%E7%AB%AF%E4%B8%93%E7%94%A8)[](https://nextdevkit.com/zh/docs/authentication/user-session#3-edge-%E8%BF%90%E8%A1%8C%E6%97%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%AE%A4%E8%AF%81%E4%BF%A1%E6%81%AF)[](https://nextdevkit.com/zh/docs/authentication/user-session#edge-getsession%E4%B8%AD%E9%97%B4%E4%BB%B6%E5%92%8Cedge%E5%87%BD%E6%95%B0%E4%B8%93%E7%94%A8)[](https://nextdevkit.com/zh/docs/authentication/user-session#%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF%E6%80%BB%E7%BB%93%E8%A1%A8)[](https://nextdevkit.com/zh/docs/authentication/user-session#%E5%B8%B8%E8%A7%81%E9%94%99%E8%AF%AF%E5%92%8C%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)[](https://nextdevkit.com/zh/docs/authentication/user-session#1-usesession-must-be-used-within-sessionprovider-%E9%94%99%E8%AF%AF)[](https://nextdevkit.com/zh/docs/authentication/user-session#2-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%92%A9%E5%AD%90)[](https://nextdevkit.com/zh/docs/authentication/user-session#3-%E4%B8%AD%E9%97%B4%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E9%94%99%E8%AF%AF%E7%9A%84-getsession)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
