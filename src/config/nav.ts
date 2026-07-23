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

import type {
  ModuleNavigationArea,
  ModuleNavigationIcon,
} from "@/core/modules";
import { moduleRegistry } from "@/modules";

/**
 * 导航链接类型
 */
export interface NavItem {
  title: string;
  href: string;
  translationKey?: string;
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
  translationKey?: string;
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
  { title: "PSEO", href: "/pseo" },
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
    {
      title: "Contact Us",
      href: `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@example.com"}`,
    },
  ] as NavItem[],

  /** 法律 (Legal) */
  legal: [
    { title: "Terms of Service", href: "/legal/terms" },
    { title: "Privacy Policy", href: "/legal/privacy" },
    { title: "Cookie Policy", href: "/legal/cookie-policy" },
  ] as NavItem[],
};

const moduleNavigationIcons: Record<ModuleNavigationIcon, LucideIcon> = {
  coins: Coins,
  dashboard: LayoutDashboard,
  headset: Headset,
  settings: Settings,
  ticket: Ticket,
  users: Users,
};

function createModuleNavigation(area: ModuleNavigationArea): NavGroup[] {
  const contributions = moduleRegistry.manifests
    .flatMap((manifest) => manifest.navigation)
    .filter((item) => item.area === area)
    .sort((left, right) => left.order - right.order);
  const groups = new Map<string, NavGroup>();

  for (const contribution of contributions) {
    const group = groups.get(contribution.group) ?? {
      title: contribution.group,
      translationKey: contribution.groupTranslationKey,
      items: [],
    };

    group.items.push({
      title: contribution.translationKey,
      translationKey: contribution.translationKey,
      href: contribution.href,
      icon: moduleNavigationIcons[contribution.icon],
    });
    groups.set(contribution.group, group);
  }

  return [...groups.values()];
}

export const dashboardNav = createModuleNavigation("dashboard");
export const adminNav = createModuleNavigation("admin");

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
