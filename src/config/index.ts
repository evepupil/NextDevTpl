// 配置模块统一导出
export { siteConfig, type SiteConfig } from "./site";
export {
  // 类型
  type NavItem,
  type NavGroup,
  type ProductNavItem,
  type ProductNavGroup,
  // Marketing 配置
  mainNav,
  productsNav,
  footerNav,
  marketingConfig,
  // Dashboard 配置
  dashboardNav,
  dashboardConfig,
  // Admin 配置
  adminNav,
  adminConfig,
} from "./nav";
export {
  // 支付配置
  paymentConfig,
  PRICE_IDS,
  getPricingPlans,
  getPricingConfig,
  findPlanByPriceId,
  getPlanPrice,
  getBaseUrl,
} from "./payment";
