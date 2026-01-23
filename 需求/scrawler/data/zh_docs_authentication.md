# 来源: https://nextdevkit.com/zh/docs/authentication

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
概述为什么使用 Better Auth
注册登录鉴权指南
# 概述
学习如何在 NEXTDEVKIT 中使用 Better Auth 设置和使用身份验证
在有了数据库的基础后，我们就可以基于数据库来搭建出登录注册系统。
NextDevKit 提供了多种 Auth 的配置和使用方式，你可以根据你的需求选择合适的方式。
## [为什么使用 Better Auth](https://nextdevkit.com/zh/docs/authentication#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8-better-auth)
其实除了自己通过 auth 库来实现登录注册功能外，还有一些云产品也提供了 Auth 功能，例如 Clerk, Supabase auth，Auth0 等。
这些产品通常提供了更丰富的功能，并且可以方便集成。主要问题一是收费挺高的，一般按照你的 MAU（月活跃用户数）来收费，第二是需要你将用户数据存储到他们的数据库中，未来的迁移成本很高，等于完全与平台绑定。
NextDevKit 为了通用性而言，并没有选择任意云平台去绑定，而是选择了 
Better Auth 是一个开源的 Auth 库，它提供了丰富的功能，并且可以方便集成，并且提供了丰富的插件生态和 OAuth 支持。
Better Auth 的优势：
  * 框架无关性 - 支持 React、Vue、Svelte、Next.js、Nuxt、Solid、Astro、Hono 等多种框架
  * 内置安全功能 - 自带双因子认证(2FA)、多租户、速率限制、CSRF 保护等
  * 开发体验友好 - 自动生成模式、完全类型安全、启用高级功能所需代码最少
  * 插件系统 - 可扩展功能，无需复杂的变通方法
  * TypeScript 优先 - 专为 TypeScript 构建，类型安全性更好


## [如何使用 Better Auth](https://nextdevkit.com/zh/docs/authentication#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-better-auth)
### [配置 .env 文件](https://nextdevkit.com/zh/docs/authentication#%E9%85%8D%E7%BD%AE-env-%E6%96%87%E4%BB%B6)
在 NextDevKit 中，我们默认使用 `BETTER_AUTH_URL` 和 `BETTER_AUTH_SECRET` 环境变量来配置 Better Auth。
第一个 `BETTER_AUTH_URL` 是指你的应用的 URL，例如本地环境 `http://localhost:3000` 或者生产环境的 `https://your-app.com`。
第二个 `BETTER_AUTH_SECRET` 是你的应用的 secret key，你可以通过 `openssl rand -base64 32` 命令来生成一个随机的 secret key。注意本地环境和生产环境的 secret key 尽量保持不一样。
### [配置 auth.ts 文件](https://nextdevkit.com/zh/docs/authentication#%E9%85%8D%E7%BD%AE-authts-%E6%96%87%E4%BB%B6)
Better Auth 需要你在 `src/lib/auth.ts` 文件中配置好对应的 login, register, forgot password, email verification 等功能的配置。
NextDevKit 已经默认配置好了一套最常用的 Better Auth 的配置，你只需要在 `src/lib/auth.ts` 文件中修改你需要的配置即可。
src/lib/auth.ts
```
export const auth = betterAuth({
	baseURL: getBaseUrl(), // 你的应用的 URL
	trustedOrigins: [getBaseUrl()],
	database: drizzleAdapter(db, { // 默认集成 drizzle 数据库
		provider: "pg", // 不同模板的数据库有所区别
		schema: { // 默认集成数据库对应的 schema
			user: user, // 用户表
			session: session, // 会话表
			account: account, // 账号表
			verification: verification, // 验证表
		},
	}),
	session: { 
		cookieCache: { // 默认开启 cookie 缓存
			enabled: true,
			maxAge: 5 * 60, // 缓存 5 分钟
		},
		expiresIn: 60 * 60 * 24 * 7, // 默认 7 天
		updateAge: 60 * 60 * 24, // 默认 1 天
		freshAge: 0, // 默认 0 秒
	},
	user: {
		deleteUser: { // 默认开启删除用户功能
			enabled: true,
		},
		additionalFields: { // 额外添加两个字段在 user 表中，可以根据你的需求添加更多的字段
			locale: { // 用户所选择的语言，在登录后会自动设置到 cookie 中
				type: "string",
				required: false,
			},
			customerId: { // 用户客户 ID
				type: "string",
				required: false,
			},
		},
		changeEmail: { // 默认开启修改邮箱功能
			enabled: true,
			sendChangeEmailVerification: async (
				{ user: { email, name }, url },
				request,
			) => {
				await sendEmail();
			},
		},
	},
	emailAndPassword: { // 默认开启 Email + Password 登录和注册功能
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user: { email, name }, url }, request) => {
			await sendEmail();
		},
	},
	emailVerification: { // 默认开启邮箱验证功能，关闭后用户注册后不需要验证邮箱
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user: { email, name }, url }, request) => {
			await sendEmail();
		},
	},
	account: {
		accountLinking: { // 默认开启账号关联功能，允许用户关联多个账号
			enabled: true,
			trustedProviders: ["google", "github"],
		},
	},
	socialProviders: { // 默认集成 Google 和 Github 的社交登录功能
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			scope: ["email", "profile"],
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	plugins: [admin()], // 默认开启 admin 插件，允许你通过 role 来区分 user
	onAPIError: {
		onError(error, ctx) {
			console.error(error, { ctx });
		},
	},
});
export type Session = typeof auth.$Infer.Session;
```

如上面的代码实例，NextDevKit 默认配置集成了两种登录和注册的方式，分别是 Email + Password 的方式，和社交登录的方式。
如上面的注释所示，NextDevKit 默认配置集成了多种功能，你可以根据你的需求选择合适的功能。
目前有的功能包括：
  * 默认开启 Email + Password 登录和注册功能
  * 默认开启邮箱验证功能，关闭后用户注册后不需要验证邮箱
  * 默认开启账号关联功能，允许用户关联多个账号
  * 默认集成 Google 和 Github 的社交登录功能
  * 默认开启 admin 插件，允许你通过 role 来区分 user
  * 默认开启 cookie 缓存，允许你通过 cookie 来缓存用户信息
  * 默认开启删除用户功能，允许你删除用户
  * 默认开启修改邮箱功能，允许你修改用户邮箱


强烈建议你阅读 
其它比较常见的功能改动包括：
  * 禁用 Email + Password 登录和注册功能
  * 添加更多的社交登录集成
  * 开启 Two Factor Authentication 双重认证功能
  * 开启 Magic Link 登录功能
  * 开启手机号登录功能
  * 加入 Passkey 设备认证功能等


这些功能你可以根据需求和官方文档来进行配置和添加。
## [邮箱登录](https://nextdevkit.com/zh/docs/authentication#%E9%82%AE%E7%AE%B1%E7%99%BB%E5%BD%95)
通过邮箱登录的功能需要你配置好对应的邮箱服务，例如 `RESEND_API_KEY`，目前 NextDevKit 默认使用 Resend 来发送邮件。
因为邮箱登录注册需要开启邮箱验证，忘记密码，重置密码等功能，所以发送邮件对于邮箱登录注册功能来说是必须的。
目前 NextDevKit 默认只集成了 Resend 来发送邮件，你可以添加其它的邮箱服务。我们会在后面提到这一点。
NextDevKit 也已经配置了默认的邮箱验证，忘记密码，重置密码等邮件模板，你可以在 `src/mail/templates` 文件夹中找到对应的模板。也可以根据你的需求来优化对应的邮件模板。
## [社交登录](https://nextdevkit.com/zh/docs/authentication#%E7%A4%BE%E4%BA%A4%E7%99%BB%E5%BD%95)
对于现代的 Web 应用来说，绝大多数人都会选择社交登录的方式进行登录。
所以社交登录的方式目前来说是必不可少的，反而是邮箱登录的方式可以考虑关闭。
### [配置 Google 登录](https://nextdevkit.com/zh/docs/authentication#%E9%85%8D%E7%BD%AE-google-%E7%99%BB%E5%BD%95)
  1. 转到 
  2. 创建新项目或选择现有项目
  3. 导航到 **"Credentials"** → **"Create Credentials"** → **"OAuth client ID"**
  4. 如需要，配置 OAuth 同意屏幕
  5. 设置 OAuth 客户端 ID：
     * **应用程序类型** ：Web 应用程序
     * **已授权的 JavaScript 来源** ：`https://your-domain.com`
     * **已授权的重定向 URI** ：`https://your-domain.com/api/auth/callback/google`


如果是本地开发需要的话，记得将 `http://localhost:3000` 添加到 **已授权的 JavaScript 来源** 中，并且将 `http://localhost:3000/api/auth/callback/google` 添加到 **已授权的重定向 URI** 中。
添加到您的 `.env` 文件：
```
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### [3. **配置 GitHub OAuth**](https://nextdevkit.com/zh/docs/authentication#3-%E9%85%8D%E7%BD%AE-github-oauth)
要启用 GitHub 身份验证：
  1. 转到 
  2. 点击 **"OAuth Apps"** → **"New OAuth App"**
  3. 填写注册表单：
     * **应用程序名称** ：NEXTDEVKIT
     * **主页 URL** ：`https://your-domain.com`（开发环境使用 `http://localhost:3000`）
     * **授权回调 URL** ：`https://your-domain.com/api/auth/callback/github`
  4. 复制 **客户端 ID** 和 **客户端密钥**


如果是本地开发需要的话，记得将 `http://localhost:3000` 添加到 **主页 URL** 中，并且将 `http://localhost:3000/api/auth/callback/github` 添加到 **授权回调 URL** 中。
添加到您的 `.env` 文件：
```
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

> 💡 **提示** ：为生产和开发环境创建不同的 OAuth 应用程序，使用不同的回调 URL。
### [添加其它社交登录](https://nextdevkit.com/zh/docs/authentication#%E6%B7%BB%E5%8A%A0%E5%85%B6%E5%AE%83%E7%A4%BE%E4%BA%A4%E7%99%BB%E5%BD%95)
除了 Google 和 Github 外，Better Auth 还支持添加其它的社交登录，例如 Facebook, Twitter, Apple 等。
你可以在 
在 NextDevKit 中，你可以首先在 `src/lib/auth.ts` 文件中添加其它的社交登录。配置对应的 clientId 和 clientSecret 等。
src/lib/auth.ts
```
socialProviders: {
	facebook: {
		clientId: process.env.FACEBOOK_CLIENT_ID as string,
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
```

然后你可以在 `src/config/oauth-provider.ts` 文件中添加对应的社交登录还有对应的 icon 显示。这个地方的配置会影响到登录页面的显示。
src/config/oauth-provider.ts
```
export const oAuthProviders = {
	google: {
		name: "Google",
		icon: Google,
	},
	github: {
		name: "GitHub",
		icon: GitHub,
	},
} as const satisfies Record<
	string,
	{
		name: string;
		icon: JSXElementConstructor<React.SVGProps<SVGSVGElement>>;
	}
>;
export type OAuthProvider = keyof typeof oAuthProviders;
```

如果你想要深入了解 Social Providers 登录的机制，可以参考 `SocialSignin` 组件的实现和对应的官方文档。
src/components/auth/social-signin.tsx
```
const handleOAuthSignin = async (provider: OAuthProvider) => {
  try {
    setIsLoading(provider);
    await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}${redirectTo}`,
    });
  } catch (error) {
    console.error(`Error signing in with ${provider}:`, error);
  } finally {
    setIsLoading(null);
  }
};
```

## [🏗️ 身份验证架构](https://nextdevkit.com/zh/docs/authentication#%EF%B8%8F-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81%E6%9E%B6%E6%9E%84)
NEXTDEVKIT 的身份验证系统包括：
```
src/
├── lib/
│   ├── auth.ts           # 主要 Better Auth 配置
│   └── auth/
│       ├── server.ts     # 服务器端认证工具
│       ├── client.ts     # 客户端认证工具
│       ├── api.ts        # API 工具
│       ├── edge.ts       # Edge 运行时工具
│       └── errors.ts     # 认证错误处理
├── components/
│   └── auth/
│       ├── login-form.tsx
│       ├── signup-form.tsx
│       ├── social-signin.tsx
│       └── forgot-password-form.tsx
```

[AWS RDS 数据库 NEXTDEVKIT 的完整 AWS RDS 设置指南，包含 SST 配置和托管 PostgreSQL 服务。](https://nextdevkit.com/zh/docs/database/database-aws-rds)[获取 session 信息 学习如何在 NEXTDEVKIT 中使用用户会话](https://nextdevkit.com/zh/docs/authentication/user-session)
[](https://nextdevkit.com/zh/docs/authentication#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8-better-auth)[](https://nextdevkit.com/zh/docs/authentication#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-better-auth)[](https://nextdevkit.com/zh/docs/authentication#%E9%85%8D%E7%BD%AE-env-%E6%96%87%E4%BB%B6)[](https://nextdevkit.com/zh/docs/authentication#%E9%85%8D%E7%BD%AE-authts-%E6%96%87%E4%BB%B6)[](https://nextdevkit.com/zh/docs/authentication#%E9%82%AE%E7%AE%B1%E7%99%BB%E5%BD%95)[](https://nextdevkit.com/zh/docs/authentication#%E7%A4%BE%E4%BA%A4%E7%99%BB%E5%BD%95)[](https://nextdevkit.com/zh/docs/authentication#%E9%85%8D%E7%BD%AE-google-%E7%99%BB%E5%BD%95)[**配置 GitHub OAuth**](https://nextdevkit.com/zh/docs/authentication#3-%E9%85%8D%E7%BD%AE-github-oauth)[](https://nextdevkit.com/zh/docs/authentication#%E6%B7%BB%E5%8A%A0%E5%85%B6%E5%AE%83%E7%A4%BE%E4%BA%A4%E7%99%BB%E5%BD%95)[](https://nextdevkit.com/zh/docs/authentication#%EF%B8%8F-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81%E6%9E%B6%E6%9E%84)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
