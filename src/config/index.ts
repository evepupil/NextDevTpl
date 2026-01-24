// 配置模块统一导出
export { siteConfig, type SiteConfig } from "./site";
export {
  // 类型
  type NavItem,
  type NavGroup,
  type ProductItem,
  type ProductGroup,
  // Marketing 配置
  mainNav,
  productNav,
  footerNav,
  marketingConfig,
  // Dashboard 配置
  dashboardNav,
  dashboardConfig,
} from "./nav";
export {
  // 支付配置
  paymentConfig,
  STRIPE_PRICE_IDS,
  getPricingPlans,
  getPricingConfig,
  findPlanByPriceId,
  getPlanPrice,
  getBaseUrl,
} from "./payment";
