// 配置模块统一导出

export {
  adminConfig,
  // Admin 配置
  adminNav,
  dashboardConfig,
  // Dashboard 配置
  dashboardNav,
  footerNav,
  // Marketing 配置
  mainNav,
  marketingConfig,
  type NavGroup,
  // 类型
  type NavItem,
  type ProductNavGroup,
  type ProductNavItem,
  productsNav,
} from "./nav";
export {
  findPlanByPriceId,
  getBaseUrl,
  getPlanPrice,
  getPricingConfig,
  getPricingPlans,
  PRICE_IDS,
  // 支付配置
  paymentConfig,
} from "./payment";
export { type SiteConfig, siteConfig } from "./site";
