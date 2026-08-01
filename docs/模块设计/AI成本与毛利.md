# AI 成本与毛利

> 模块定位：记录 AI 用量与估算成本，计算功能和用户维度的运营毛利
>
> 对应代码：`src/core/services/ai.ts`、`src/adapters/ai/`、
> `src/features/credits/`、`src/features/operations/`
>
> 所属里程碑：[M4 - v3.4 AI 成本与毛利](../roadmap3.x.md#m4)
>
> 当前状态：已完成
>
> 最近更新时间：2026-08-02

## 职责与边界

本模块负责从 AI 适配器取得用量、延迟和模型信息，通过版本化价格配置估算成本，
再与积分或收入数据组合成运营毛利。结果用于产品和定价决策，不作为会计凭证。

## 结构与数据流

```text
AI 请求 -> AI 适配器 -> content + model + usage + latency
                         |                  |
                    价格配置            积分/收入
                         \--------> 成本与毛利指标
```

## 关键决策

- `AICompletionResult` 增加可选用量与供应商信息，保持不支持用量的适配器可用。
- 用量状态区分 `actual`、`estimated` 和 `unavailable`。
- 模型价格包含币种、生效时间和来源说明，历史请求使用当时有效价格。
- 指标只保存 Token、耗时、模型、功能和内部 ID，不保存提示词或回复正文。
- 毛利按确认收入或积分收入减去可归属的 AI 变动成本计算，并显示覆盖率。
- 供应商账单抽样用于校准估算，不能把本地估算声明为实际账单。

## 当前实现

`AICompletionResult` 现在统一返回 `provider`、`model`、`latencyMs` 和 `usage`。
`usage` 明确包含输入、输出、总 Token 以及 `actual`、`estimated` 或
`unavailable` 状态：OpenAI Compatible 读取 `prompt_tokens`、`completion_tokens`，
Anthropic 读取 `input_tokens`、`output_tokens`，Workers AI 尝试读取兼容的 usage 字段，
取不到时返回 `unavailable`。适配器仍只返回模型文本给业务调用方，不把输入消息或输出
正文写入运营表。

运营模块新增 `ai_usage_event` 表和 `recordAIUsage`，保存供应商、模型、功能、可选的
内部用户 ID、Token、耗时、成功状态和积分归属。业务功能在 AI 调用边界记录该事实，
运营驾驶舱按模型、功能和用户展示请求量、成功率、平均耗时和 Token 覆盖率。

`ai-usage.ts` 内置按生效时间版本化的 USD 价格表，成本以最小货币单位估算；未知模型、
无 Token 或不支持 usage 时标记 `unavailable`。毛利使用周期确认收入减估算 AI 成本，
只用于运营判断，不声明为会计利润。

## 验证方式

- `src/test/adapters/ai.test.ts` 覆盖 Anthropic 无 usage 的安全降级；适配器契约会返回
  provider、model、latency 和明确的 usage 状态。
- `src/test/operations/ai-usage.test.ts` 覆盖价格生效时间、Token 成本、未知价格、
  覆盖率和毛利计算。
- `pnpm db:generate:checked` 已确认 `drizzle/0005_fuzzy_anthem.sql` 与
  `ai_usage_event` Schema 快照一致。
- 运营表字段不包含提示词、模型回复、密钥或上传内容；价格与成本均标注为估算来源。

## 待扩展项

- 图像、音频和视频模型的非 Token 计价单位。
- AI Gateway 成本与缓存命中数据。

## 改动历史

- 2026-08-01：确定 AI 用量、估算状态、价格版本和隐私边界。
- 2026-08-02：扩展三类 AI 适配器统一用量契约，新增本地用量表、成本估算、毛利聚合和驾驶舱区块。
