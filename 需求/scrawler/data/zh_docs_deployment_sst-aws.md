# 来源: https://nextdevkit.com/zh/docs/deployment/sst-aws

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
[](https://nextdevkit.com/zh/docs/deployment)[](https://nextdevkit.com/zh/docs/deployment/vercel)[](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)[](https://nextdevkit.com/zh/docs/deployment/sst-aws)[](https://nextdevkit.com/zh/docs/deployment/container)
简体中文
AWS SST🌟 为什么选择 AWS SST？
部署指南
# AWS SST
使用 Serverless Stack (SST) 和基础设施即代码将 NEXTDEVKIT 部署到 AWS
使用 Serverless Stack (SST) 将您的 NEXTDEVKIT 应用程序部署到 AWS，以获得企业级基础设施和完全控制及可扩展性。
## [🌟 为什么选择 AWS SST？](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-aws-sst)
AWS SST 适用于需要以下功能的企业应用程序：
  * **🏗️ 基础设施即代码** ：版本控制、可重复的部署
  * **🎭 多环境** ：隔离的预发布和生产环境
  * **🔧 完整 AWS 集成** ：访问所有 AWS 服务和无限可扩展性
  * **🛡️ 类型安全** ：TypeScript 基础设施减少配置错误
  * **💰 成本优化** ：仅为使用的内容付费，无服务器定价
  * **🔐 企业安全** ：AWS 安全最佳实践和合规就绪


## [📋 先决条件](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6)
在部署之前，确保您拥有：
  * **AWS 账户** ：
  * **AWS CLI** ：
  * **Node.js 20+** ：
  * **环境变量** ：准备好环境变量（参见[环境指南](https://nextdevkit.com/docs/environment/sst-aws)）


## [🚀 部署步骤](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)
### [第 1 步：配置环境变量](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-1-%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
请参考[环境指南](https://nextdevkit.com/docs/environment/sst-aws)了解详细的环境变量。
复制 `.env.example` 到 `.env.production` 并更新环境变量。
### [第 2 步：配置 AWS 凭据](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-2-%E6%AD%A5%E9%85%8D%E7%BD%AE-aws-%E5%87%AD%E6%8D%AE)
设置您的 AWS 凭据：
```
# 配置 AWS CLI
aws configure
# AWS Access Key ID: your-access-key-id
# AWS Secret Access Key: your-secret-access-key
# Default region name: us-east-1
# Default output format: json
```

或编辑 `~/.aws/credentials` 文件：
```
[default]
aws_access_key_id = your-access-key-id
aws_secret_access_key = your-secret-access-key
```

请确认 AWS 凭据 IAM 权限正确。您可以参考 
### [第 3 步：初始化 SST 项目](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-3-%E6%AD%A5%E5%88%9D%E5%A7%8B%E5%8C%96-sst-%E9%A1%B9%E7%9B%AE)
更新项目根目录中的 `sst.config.ts` 文件：
```
export default $config({
	app(input) {
		return {
			name: "nextdevkit-aws-template",
			removal: input?.stage === "production" ? "retain" : "remove",
			protect: ["production"].includes(input?.stage),
			home: "aws",
			providers: {
				cloudflare: "6.3.1",
				aws: { version: "6.83.0", region: "us-east-1" },
			},
		};
	},
  async run() {
		const vpc = new sst.aws.Vpc("YourVpcName", {
			/// ...
		});
		const database = new sst.aws.Postgres("YourDatabaseName", {
			/// ...
		});
		const bucket = new sst.aws.Bucket(
			"YourBucketName",
			{
				/// ...
			}
		);
		const migrator = new sst.aws.Function("YourMigratorName", {
			handler: "src/database/migrator.handler",
			link: [database],
			vpc,
			/// ...
		});
		if (!$dev) {
			new aws.lambda.Invocation("DatabaseMigratorInvocation", {
				input: Date.now().toString(),
				functionName: migrator.name,
			});
		}
		new sst.aws.Nextjs("YourNextjsSiteName", {
			link: [database, bucket],
			vpc,
			domain: {
				name: "your-domain.com",
				dns: sst.cloudflare.dns({
					proxy: true,
				}),
			},
			environment: {
				NEXT_PUBLIC_AVATARS_BUCKET_NAME: bucket.name,
			},
		});
		new sst.x.DevCommand("DrizzleStudio", {
			link: [database],
			dev: {
				command: "npx drizzle-kit studio",
			},
		});
	},
});
```

如果您更改了数据库名称，需要更新 `drizzle.config.ts` 文件和 `src/database/client` 文件资源名称。
如果您不想使用 cloudflare dns，可以删除 `domain.dns` 属性。您可以参考 
### [第 4 步：配置数据库](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-4-%E6%AD%A5%E9%85%8D%E7%BD%AE%E6%95%B0%E6%8D%AE%E5%BA%93)
如果使用 AWS RDS 作为您的数据库，您可以参考[数据库指南](https://nextdevkit.com/docs/database/database-aws-rds)了解更多关于数据库设置的信息。
更新 `sst.config.ts` 文件以包含 RDS 配置。
```
# 将数据库密码设置为密钥
npx sst secret set NextDevKitDBPassword your-secure-password
```

如果您想更改密钥名称，需要在 `database` 属性中更新 `sst.config.ts` 文件。
更新您的 `sst.config.ts` 以包含 RDS 配置：
```
// 添加到您的 sst.config.ts
const database = new sst.aws.Postgres("NextDevKitDB", {
  instance: "t4g.micro",
  storage: "20 GB",
  version: "16.4",
  vpc,
  proxy: true,
  // 在此设置您的密钥名称
  password: new sst.Secret("NextDevKitDBPassword").value,
});
```

### [第 5 步：设置生产密钥](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-5-%E6%AD%A5%E8%AE%BE%E7%BD%AE%E7%94%9F%E4%BA%A7%E5%AF%86%E9%92%A5)
如果您想使用 SST 配置生产密钥，可以在 `sst.config.ts` 文件中设置密钥。
```
# 设置生产环境变量
npx sst secret set BETTER_AUTH_SECRET your-32-character-secret-key
npx sst secret set RESEND_API_KEY re_your_resend_api_key
npx sst secret set STRIPE_SECRET_KEY sk_live_your_stripe_secret_key
npx sst secret set GITHUB_CLIENT_SECRET your-github-client-secret
npx sst secret set GOOGLE_CLIENT_SECRET your-google-client-secret
```

```
new sst.aws.Nextjs("NextDevKitWeb", {
  link: [database, bucket],
  vpc,
  domain: {
    name: "aws.nextdevkit.com",
    dns: sst.cloudflare.dns({
      proxy: true,
    }),
  },
  environment: {
    NEXT_PUBLIC_AVATARS_BUCKET_NAME: bucket.name,
    // 在此设置您的密钥环境变量
    BETTER_AUTH_SECRET: $dev ? process.env.BETTER_AUTH_SECRET : new sst.Secret("BETTER_AUTH_SECRET").value,
    RESEND_API_KEY: $dev ? process.env.RESEND_API_KEY : new sst.Secret("RESEND_API_KEY").value,
    STRIPE_SECRET_KEY: $dev ? process.env.STRIPE_SECRET_KEY : new sst.Secret("STRIPE_SECRET_KEY").value,
    GITHUB_CLIENT_SECRET: $dev ? process.env.GITHUB_CLIENT_SECRET : new sst.Secret("GITHUB_CLIENT_SECRET").value,
    GOOGLE_CLIENT_SECRET: $dev ? process.env.GOOGLE_CLIENT_SECRET : new sst.Secret("GOOGLE_CLIENT_SECRET").value,
  },
});
```

### [第 6 步：部署到 AWS](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-6-%E6%AD%A5%E9%83%A8%E7%BD%B2%E5%88%B0-aws)
```
# 部署到开发环境
npx sst dev
# 部署到生产环境
npx sst deploy --stage production
```

### [第 7 步：数据库迁移](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-7-%E6%AD%A5%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)
部署后运行数据库迁移：
```
# 生成迁移文件
pnpm run db:generate
```

# [迁移在部署期间自动应用](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E8%BF%81%E7%A7%BB%E5%9C%A8%E9%83%A8%E7%BD%B2%E6%9C%9F%E9%97%B4%E8%87%AA%E5%8A%A8%E5%BA%94%E7%94%A8)
```
if (!$dev) {
  new aws.lambda.Invocation("DatabaseMigratorInvocation", {
    input: Date.now().toString(),
    functionName: migrator.name,
  });
}
```

SST 配置在部署期间使用 Lambda 函数自动处理数据库迁移。
### [第 8 步：更改为 ECS 部署](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-8-%E6%AD%A5%E6%9B%B4%E6%94%B9%E4%B8%BA-ecs-%E9%83%A8%E7%BD%B2)
要在容器中部署我们的 Next.js 应用，我们将使用 AWS Fargate 和 Amazon ECS。替换您的 sst.config.ts 中的 run 函数。
```
async run() {
  const vpc = new sst.aws.Vpc("MyVpc");
  const cluster = new sst.aws.Cluster("MyCluster", { vpc });
  new sst.aws.Service("MyService", {
    cluster,
    loadBalancer: {
      ports: [{ listen: "80/http", forward: "3000/http" }],
    },
    dev: {
      command: "npm run dev",
    },
  });
}
```

有关 ECS 部署的更多信息，您可以参考 
## [🎉 下一步](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您的 NEXTDEVKIT 已部署在 AWS 上，您可以：
  1. **🔧 配置监控** ：设置 CloudWatch 警报和仪表板
  2. **🔐 安全审查** ：审核 IAM 权限和安全组
  3. **📊 性能** ：监控 Lambda 指标并优化
  4. **💰 成本管理** ：设置计费警报和成本跟踪
  5. **🚀 扩展** ：添加更多区域并优化增长


### [其他资源](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)
您的 NEXTDEVKIT 应用程序现在运行在企业级 AWS 基础设施上！🌟🚀
[Cloudflare Workers 使用 OpenNext.js 将 NEXTDEVKIT 部署到 Cloudflare Workers 以获得全球边缘性能](https://nextdevkit.com/zh/docs/deployment/cloudflare-worker)[容器部署 使用 Docker 容器将 NEXTDEVKIT 部署到各种云平台](https://nextdevkit.com/zh/docs/deployment/container)
[](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-aws-sst)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E9%83%A8%E7%BD%B2%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-1-%E6%AD%A5%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-2-%E6%AD%A5%E9%85%8D%E7%BD%AE-aws-%E5%87%AD%E6%8D%AE)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-3-%E6%AD%A5%E5%88%9D%E5%A7%8B%E5%8C%96-sst-%E9%A1%B9%E7%9B%AE)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-4-%E6%AD%A5%E9%85%8D%E7%BD%AE%E6%95%B0%E6%8D%AE%E5%BA%93)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-5-%E6%AD%A5%E8%AE%BE%E7%BD%AE%E7%94%9F%E4%BA%A7%E5%AF%86%E9%92%A5)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-6-%E6%AD%A5%E9%83%A8%E7%BD%B2%E5%88%B0-aws)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-7-%E6%AD%A5%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%81%E7%A7%BB)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E8%BF%81%E7%A7%BB%E5%9C%A8%E9%83%A8%E7%BD%B2%E6%9C%9F%E9%97%B4%E8%87%AA%E5%8A%A8%E5%BA%94%E7%94%A8)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E7%AC%AC-8-%E6%AD%A5%E6%9B%B4%E6%94%B9%E4%B8%BA-ecs-%E9%83%A8%E7%BD%B2)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#-%E4%B8%8B%E4%B8%80%E6%AD%A5)[](https://nextdevkit.com/zh/docs/deployment/sst-aws#%E5%85%B6%E4%BB%96%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
