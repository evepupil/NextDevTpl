# 来源: https://nextdevkit.com/zh/docs/credits/cron-jobs

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)
[](https://nextdevkit.com/zh/docs/credits)[](https://nextdevkit.com/zh/docs/credits/cron-jobs)[](https://nextdevkit.com/zh/docs/credits/api-reference)
[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
定时任务设置📋 概述
积分系统
# 定时任务设置
使用各种定时任务平台配置自动积分发放和过期处理
## [📋 概述](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E6%A6%82%E8%BF%B0)
积分系统需要两个自动化定时任务才能正常运行：
  1. **发放积分任务** - 为订阅用户分发月度积分
  2. **过期积分任务** - 处理过期的积分批次


两个任务都必须配置为使用适当的身份验证调用您的 API 端点。
## [🔐 身份验证](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)
所有定时任务请求必须在 Authorization 头中包含 `CRON_SECRET`：
```
Authorization: Bearer your-cron-secret-here
```

### [生成 CRON_SECRET](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E7%94%9F%E6%88%90-cron_secret)
生成一个安全的随机字符串（16+ 字符）：
```
# 使用 OpenSSL
openssl rand -hex 16
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# 或使用任何密码生成器
```

添加到您的 `.env` 文件：
```
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## [🔄 定时任务端点](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E7%AB%AF%E7%82%B9)
### [1. 发放积分端点](https://nextdevkit.com/zh/docs/credits/cron-jobs#1-%E5%8F%91%E6%94%BE%E7%A7%AF%E5%88%86%E7%AB%AF%E7%82%B9)
**URL:** `https://yourdomain.com/api/jobs/credits/grant`
**用途：** 为符合条件的用户发放月度订阅积分
**计划：** 每天 **01:00 UTC** （UTC 午夜）
**HTTP 方法：** `GET`
**请求头：**
```
Authorization: Bearer your-cron-secret
```

**响应：**
```
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-01-15",
  "duration": 1250,
  "results": {
    "processed": 150,
    "successful": 148,
    "skipped": 2,
    "failed": 0
  }
}
```

### [2. 过期积分端点](https://nextdevkit.com/zh/docs/credits/cron-jobs#2-%E8%BF%87%E6%9C%9F%E7%A7%AF%E5%88%86%E7%AB%AF%E7%82%B9)
**URL:** `https://yourdomain.com/api/jobs/credits/expire`
**用途：** 处理过期的积分批次并更新余额
**计划：** 每天 **04:00 UTC** （UTC 凌晨 4 点）
**HTTP 方法：** `GET`
**请求头：**
```
Authorization: Bearer your-cron-secret
```

**响应：**
```
{
  "success": true,
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "duration": 850,
  "results": {
    "processedBatches": 45,
    "processedUsers": 38,
    "totalExpiredAmount": 1250
  }
}
```

## [🚀 平台设置指南](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E5%B9%B3%E5%8F%B0%E8%AE%BE%E7%BD%AE%E6%8C%87%E5%8D%97)
### [选项 1：Vercel 定时任务](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-1vercel-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1)
**最适合：** 部署在 Vercel 上的应用
#### [设置步骤](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4)
  1. **在项目根目录创建`vercel.json` ：**


```
{
  "crons": [
    {
      "path": "/api/jobs/credits/grant",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/jobs/credits/expire",
      "schedule": "0 4 * * *"
    }
  ]
}
```

  1. **在 Vercel 中添加环境变量：**


转到项目 → Settings → Environment Variables：
  * Key: `CRON_SECRET`
  * Value: `your-generated-secret`


  1. **部署更改：**


```
git add vercel.json
git commit -m "Add cron jobs configuration"
git push
```

  1. **在 Vercel 控制面板中验证：**


转到项目 → Deployments → Cron Jobs 查看活动任务。
**Cron 计划格式：**
  * `0 1 * * *` = 每天 01:00 UTC
  * `0 4 * * *` = 每天 04:00 UTC


**重要说明：**
  * ✅ 在 Vercel Pro 及以上计划中可用
  * ✅ Vercel 自动身份验证
  * ✅ 内置监控和日志
  * ⚠️ 最大执行时间：10 秒（Hobby）、60 秒（Pro）、300 秒（Enterprise）


* * *
### [选项 2：Cloudflare 计划任务 Workers](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-2cloudflare-%E8%AE%A1%E5%88%92%E4%BB%BB%E5%8A%A1-workers)
**最适合：** 部署在 Cloudflare Pages/Workers 上的应用
#### [设置步骤](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-1)
  1. **在 Cloudflare 控制面板中创建新 Worker：**


导航到 Workers & Pages → Create Worker
  1. **配置 Worker 代码：**


```
// grant-credits-worker.js
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch('https://yourdomain.com/api/jobs/credits/grant', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET}`,
      },
    });
    const data = await response.json();
    console.log('Grant credits job completed:', data);
  },
};
```

  1. **添加 Cron 触发器：**


在 Worker 设置 → Triggers → Cron Triggers：
  * Schedule: `0 1 * * *`


  1. **设置环境变量：**


在 Worker 设置 → Variables：
  * Variable name: `CRON_SECRET`
  * Value: `your-generated-secret`


  1. **为过期积分任务重复操作：**


创建另一个 Worker，计划为 `0 1 * * *`，指向过期端点。
**重要说明：**
  * ✅ 免费套餐可用，每天 100,000 次请求
  * ✅ 全球边缘网络
  * ✅ 可靠执行
  * ⚠️ 每个定时任务需要单独的 Worker


* * *
### [选项 3：cron-job.org](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-3cron-joborg)
**最适合：** 任何部署平台，设置简单
#### [设置步骤](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-2)
  1. **在**


免费账户允许最多 50 个定时任务。
  1. **创建第一个定时任务（发放积分）：**


点击 "Create Cronjob" 并配置：
**常规设置：**
  * Title: `Grant Monthly Credits`
  * Address: `https://yourdomain.com/api/jobs/credits/grant`
  * Request method: `GET`


**计划：**
  * Execution time: `01:00`（凌晨 1 点）
  * Timezone: `UTC`
  * Days: 每天


**高级设置：**
  * HTTP Headers:
```
Authorization: Bearer your-cron-secret
```



**通知：**
  * 启用失败的电子邮件通知（推荐）


  1. **创建第二个定时任务（过期积分）：**


重复配置：
  * Title: `Expire Credits`
  * Address: `https://yourdomain.com/api/jobs/credits/expire`
  * Execution time: `04:00`


  1. **保存并激活：**


点击 "Create" 并确保状态显示为 "Enabled"。
**重要说明：**
  * ✅ 提供免费套餐
  * ✅ 失败的电子邮件通知
  * ✅ 执行历史和日志
  * ✅ 适用于任何平台
  * ⚠️ 不如平台原生解决方案可靠
  * ⚠️ 每个环境需要手动设置


* * *
### [选项 4：Upstash QStash](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-4upstash-qstash)
**最适合：** 现代无服务器应用，高可靠性
#### [设置步骤](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-3)
  1. **在**


导航到 QStash 部分。
  1. **获取 QStash 令牌：**


从控制面板复制您的 QStash Publishing Token。
  1. **创建计划请求：**


使用 QStash API 或控制面板：
**发放积分计划：**
```
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://yourdomain.com/api/jobs/credits/grant",
    "cron": "0 1 * * *",
    "headers": {
      "Authorization": "Bearer your-cron-secret"
    }
  }'
```

**过期积分计划：**
```
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://yourdomain.com/api/jobs/credits/expire",
    "cron": "0 4 * * *",
    "headers": {
      "Authorization": "Bearer your-cron-secret"
    }
  }'
```

  1. **在 Upstash 控制面板中验证：**


转到 QStash → Schedules 查看已配置的任务。
**重要说明：**
  * ✅ 免费套餐：每天 500 条消息
  * ✅ 内置重试和死信队列
  * ✅ 优秀的可靠性
  * ✅ 请求/响应日志
  * ✅ 适用于任何平台
  * ⚠️ 需要 API 设置


* * *
### [选项 5：GitHub Actions（不推荐用于生产环境）](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-5github-actions%E4%B8%8D%E6%8E%A8%E8%8D%90%E7%94%A8%E4%BA%8E%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83)
**最适合：** 仅用于开发/测试
#### [设置步骤](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-4)
  1. **创建`.github/workflows/cron-jobs.yml` ：**


```
name: Credits Cron Jobs
on:
  schedule:
    # 每天 00:00 UTC 发放积分
    - cron: '0 0 * * *'
    # 每天 01:00 UTC 过期积分
    - cron: '0 1 * * *'
  workflow_dispatch: # 允许手动触发
jobs:
  grant-credits:
    if: github.event.schedule == '0 0 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Grant Monthly Credits
        run: |
          curl -X GET "https://yourdomain.com/api/jobs/credits/grant" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
  expire-credits:
    if: github.event.schedule == '0 1 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Expire Credits
        run: |
          curl -X GET "https://yourdomain.com/api/jobs/credits/expire" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

  1. **在 GitHub 中添加密钥：**


Repository → Settings → Secrets → New repository secret：
  * Name: `CRON_SECRET`
  * Value: `your-generated-secret`


**为何不推荐：**
  * ⚠️ 不太可靠（可能延迟或跳过）
  * ⚠️ 需要公共仓库或 GitHub Pro
  * ⚠️ 不适用于关键操作
  * ⚠️ 可能有速率限制


* * *
## [🔍 监控和调试](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E7%9B%91%E6%8E%A7%E5%92%8C%E8%B0%83%E8%AF%95)
### [检查定时任务执行](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E6%A3%80%E6%9F%A5%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E6%89%A7%E8%A1%8C)
每个任务返回唯一的 `jobId` 用于追踪。监控应用日志：
```
# Vercel
vercel logs --follow
# Cloudflare
wrangler tail
# 检查应用日志：
[Credits Grant Job abc123] Starting daily grant process
[Credits Grant Job abc123] Completed in 1250ms. Processed: 150, Successful: 148
```

### [常见问题](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
#### [1. 身份验证失败](https://nextdevkit.com/zh/docs/credits/cron-jobs#1-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81%E5%A4%B1%E8%B4%A5)
**错误：** `{ "error": "Unauthorized" }`
**解决方案：**
  * 验证已设置 `CRON_SECRET` 环境变量
  * 检查 Authorization 头格式：`Bearer your-secret`
  * 确保密钥中没有额外的空格或换行符


#### [2. 任务超时](https://nextdevkit.com/zh/docs/credits/cron-jobs#2-%E4%BB%BB%E5%8A%A1%E8%B6%85%E6%97%B6)
**错误：** 任务超时或返回 504
**解决方案：**
  * 在平台设置中增加执行超时时间
  * 优化数据库查询
  * 分批处理用户
  * 考虑拆分为多个任务


#### [3. 重复发放](https://nextdevkit.com/zh/docs/credits/cron-jobs#3-%E9%87%8D%E5%A4%8D%E5%8F%91%E6%94%BE)
**症状：** 用户多次收到积分
**预防措施：**
  * 系统使用 `referenceId` 自动防止重复
  * 检查数据库中 `grantPeriod` 的唯一性
  * 确保每个端点只配置了一个定时任务


#### [4. 未发放积分](https://nextdevkit.com/zh/docs/credits/cron-jobs#4-%E6%9C%AA%E5%8F%91%E6%94%BE%E7%A7%AF%E5%88%86)
**检查：**
```
// 验证订阅配置
console.log(appConfig.credits.subscription);
// 检查活动订阅
const purchases = await db
  .select()
  .from(purchase)
  .where(eq(purchase.status, 'active'));
console.log(`Active subscriptions: ${purchases.length}`);
```

### [手动测试](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E6%89%8B%E5%8A%A8%E6%B5%8B%E8%AF%95)
手动测试端点：
```
# 测试发放端点
curl -X GET "https://yourdomain.com/api/jobs/credits/grant" \
  -H "Authorization: Bearer your-cron-secret"
# 测试过期端点
curl -X GET "https://yourdomain.com/api/jobs/credits/expire" \
  -H "Authorization: Bearer your-cron-secret"
```

## [📊 最佳实践](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)
### [1. 时间安排](https://nextdevkit.com/zh/docs/credits/cron-jobs#1-%E6%97%B6%E9%97%B4%E5%AE%89%E6%8E%92)
**推荐计划：**
  * **发放：** 01:00 UTC - 一天开始时确保积分早期可用
  * **过期：** 04:00 UTC - 发放后，防止竞态条件


**为何分开时间？**
  * 防止数据库更新冲突
  * 先发放，再过期清理
  * 出现问题时更易调试


### [2. 监控](https://nextdevkit.com/zh/docs/credits/cron-jobs#2-%E7%9B%91%E6%8E%A7)
为以下情况设置警报：
  * ✅ 任务执行失败
  * ✅ 响应时间 > 5 秒
  * ✅ 错误率 > 1%
  * ✅ 24 小时内无成功执行


## [📚 相关文档](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E7%9B%B8%E5%85%B3%E6%96%87%E6%A1%A3)
  * 🎯 [积分系统概述](https://nextdevkit.com/docs/credits) - 了解积分系统
  * 🔧 [API 参考](https://nextdevkit.com/docs/credits/api-reference) - 详细的 API 文档
  * 💡 [使用示例](https://nextdevkit.com/docs/credits/usage-examples) - 实现示例


[积分系统概述 了解 NEXTDEVKIT 中用于管理用户积分、消费和变现的完整积分系统](https://nextdevkit.com/zh/docs/credits)[API 参考 积分系统函数和服务器操作的完整 API 参考](https://nextdevkit.com/zh/docs/credits/api-reference)
[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E6%A6%82%E8%BF%B0)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E7%94%9F%E6%88%90-cron_secret)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E7%AB%AF%E7%82%B9)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#1-%E5%8F%91%E6%94%BE%E7%A7%AF%E5%88%86%E7%AB%AF%E7%82%B9)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#2-%E8%BF%87%E6%9C%9F%E7%A7%AF%E5%88%86%E7%AB%AF%E7%82%B9)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E5%B9%B3%E5%8F%B0%E8%AE%BE%E7%BD%AE%E6%8C%87%E5%8D%97)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-1vercel-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-2cloudflare-%E8%AE%A1%E5%88%92%E4%BB%BB%E5%8A%A1-workers)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-1)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-3cron-joborg)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-2)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-4upstash-qstash)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-3)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E9%80%89%E9%A1%B9-5github-actions%E4%B8%8D%E6%8E%A8%E8%8D%90%E7%94%A8%E4%BA%8E%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E8%AE%BE%E7%BD%AE%E6%AD%A5%E9%AA%A4-4)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E7%9B%91%E6%8E%A7%E5%92%8C%E8%B0%83%E8%AF%95)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E6%A3%80%E6%9F%A5%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1%E6%89%A7%E8%A1%8C)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#1-%E8%BA%AB%E4%BB%BD%E9%AA%8C%E8%AF%81%E5%A4%B1%E8%B4%A5)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#2-%E4%BB%BB%E5%8A%A1%E8%B6%85%E6%97%B6)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#3-%E9%87%8D%E5%A4%8D%E5%8F%91%E6%94%BE)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#4-%E6%9C%AA%E5%8F%91%E6%94%BE%E7%A7%AF%E5%88%86)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#%E6%89%8B%E5%8A%A8%E6%B5%8B%E8%AF%95)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#1-%E6%97%B6%E9%97%B4%E5%AE%89%E6%8E%92)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#2-%E7%9B%91%E6%8E%A7)[](https://nextdevkit.com/zh/docs/credits/cron-jobs#-%E7%9B%B8%E5%85%B3%E6%96%87%E6%A1%A3)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
