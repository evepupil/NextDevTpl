import {
  Activity,
  Bot,
  Coins,
  CreditCard,
  Globe,
  HardDrive,
  Headset,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Shield,
  Ticket,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

/**
 * 导航链接类型
 */
export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
  description?: string;
}

/**
 * 导航分组类型
 */
export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Products 下拉菜单项类型
 */
export interface ProductNavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Products 下拉菜单分组类型
 */
export interface ProductNavGroup {
  title: string;
  items: ProductNavItem[];
}

// ============================================
// Marketing 导航配置
// ============================================

/**
 * Products 下拉菜单内容
 */
export const productsNav: ProductNavGroup[] = [
  {
    title: "Core",
    items: [
      {
        title: "Authentication",
        href: "/#features",
        description: "Multi-provider auth with session management",
        icon: Shield,
      },
      {
        title: "Payments",
        href: "/#features",
        description: "Subscriptions and one-time purchases",
        icon: CreditCard,
      },
      {
        title: "Credits",
        href: "/#features",
        description: "Double-entry bookkeeping with FIFO expiration",
        icon: Coins,
      },
    ],
  },
  {
    title: "DX Platform",
    items: [
      {
        title: "Background Jobs",
        href: "/#features",
        description: "Async processing with Inngest",
        icon: Zap,
      },
      {
        title: "Internationalization",
        href: "/#features",
        description: "Multi-language with next-intl",
        icon: Globe,
      },
      {
        title: "AI Integration",
        href: "/#features",
        description: "Multi-model LLM abstraction",
        icon: Bot,
      },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      {
        title: "Admin Panel",
        href: "/#features",
        description: "User and ticket management",
        icon: UserCog,
      },
      {
        title: "File Storage",
        href: "/#features",
        description: "S3/R2 cloud storage",
        icon: HardDrive,
      },
      {
        title: "Monitoring",
        href: "/#features",
        description: "Logging and error tracking",
        icon: Activity,
      },
    ],
  },
];

/**
 * 主导航链接 (Header)
 */
export const mainNav: NavItem[] = [
  { title: "Docs", href: "/docs" },
  { title: "Pricing", href: "/#pricing" },
  { title: "Blog", href: "/blog" },
];

/**
 * Footer 导航配置
 */
export const footerNav = {
  /** 产品 (Product) */
  product: [
    { title: "Pricing", href: "/#pricing" },
    { title: "Changelog", href: "/blog" },
    { title: "Contact Us", href: "mailto:hello@example.com" },
  ] as NavItem[],

  /** 法律 (Legal) */
  legal: [
    { title: "Terms of Service", href: "/legal/terms" },
    { title: "Privacy Policy", href: "/legal/privacy" },
    { title: "Cookie Policy", href: "/legal/cookie-policy" },
  ] as NavItem[],
};

// ============================================
// Dashboard 导航配置
// ============================================

/**
 * Dashboard 侧边栏导航分组
 */
export const dashboardNav: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Credits",
        href: "/dashboard/credits",
        icon: Coins,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
      {
        title: "Support",
        href: "/dashboard/support",
        icon: Headset,
      },
    ],
  },
];

// ============================================
// Admin 导航配置
// ============================================

/**
 * Admin 侧边栏导航分组
 */
export const adminNav: NavGroup[] = [
  {
    title: "管理中心",
    items: [
      {
        title: "控制面板",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "用户管理",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "工单管理",
        href: "/admin/tickets",
        icon: Ticket,
      },
    ],
  },
];

// ============================================
// 导出配置对象
// ============================================

/**
 * Marketing 页面配置
 */
export const marketingConfig = {
  mainNav,
  footerNav,
};

/**
 * Dashboard 页面配置
 */
export const dashboardConfig = {
  sidebarNav: dashboardNav,
};

/**
 * Admin 页面配置
 */
export const adminConfig = {
  sidebarNav: adminNav,
};
