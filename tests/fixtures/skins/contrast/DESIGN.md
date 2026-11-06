# 对比皮肤测试夹具

本目录为 M2 皮肤包校验与页面替换验收提供独立实现，不作为内置皮肤发布。

## 页面与外壳

每个登记页面根节点使用与视图契约一致的 data-skin-view 标记。认证、营销和工作区布局分别标记为 auth.layout、marketing.layout、shared.dashboard-layout；营销页头单独标记为 marketing.header。

认证页采用单列窄布局，保留资料表单、登录、注册、密码重置及 OAuth 操作。品牌图与名称并列展示，不放置功能说明区块。

## 双语文案

页面随当前语言显示中文或英文。核心表单、账单和工单状态优先复用项目翻译；皮肤自己的预览、空状态和辅助标签按页面语言提供对应文案。

## 品牌素材

assets/brand.svg 是从仓库 src/app/icon.svg 复制的本地品牌图。素材清单记录 NextDevTpl contributors、MIT 许可及来源路径；页头和认证布局都使用静态图片导入与 Next Image 展示。工作区导航也使用同一素材。
