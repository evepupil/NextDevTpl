import {
  Box,
  Cpu,
  Eye,
  Globe,
  Headphones,
  Image,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  type LucideIcon,
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
 * Mega Menu 产品项类型
 */
export interface ProductItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

/**
 * Mega Menu 产品分组类型
 */
export interface ProductGroup {
  title: string;
  items: ProductItem[];
}

// ============================================
// Marketing 导航配置
// ============================================

/**
 * 主导航链接 (Header)
 */
export const mainNav: NavItem[] = [
  { title: "Docs", href: "/docs" },
  { title: "Pricing", href: "/#pricing" },
  { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
];

/**
 * Products Mega Menu 配置
 */
export const productNav: Record<string, ProductGroup> = {
  dxPlatform: {
    title: "DX Platform",
    items: [
      {
        icon: Cpu,
        title: "Previews",
        description: "Helping teams ship 6× faster",
        href: "/products/previews",
      },
      {
        icon: Search,
        title: "AI",
        description: "Powering breakthroughs",
        href: "/products/ai",
      },
    ],
  },
  infrastructure: {
    title: "Managed Infrastructure",
    items: [
      {
        icon: Globe,
        title: "Rendering",
        description: "Fast, scalable, and reliable",
        href: "/products/rendering",
      },
      {
        icon: Eye,
        title: "Observability",
        description: "Trace every step",
        href: "/products/observability",
      },
      {
        icon: ShieldCheck,
        title: "Security",
        description: "Scale without compromising",
        href: "/products/security",
      },
    ],
  },
  openSource: {
    title: "Open Source",
    items: [
      {
        icon: Rocket,
        title: "Next.js",
        description: "The native Next.js platform",
        href: "/products/nextjs",
      },
      {
        icon: Box,
        title: "Turborepo",
        description: "Speed with Enterprise scale",
        href: "/products/turborepo",
      },
      {
        icon: Palette,
        title: "AI SDK",
        description: "The AI Toolkit for TypeScript",
        href: "/products/ai-sdk",
      },
    ],
  },
};

/**
 * Footer 导航配置
 */
export const footerNav = {
  /** 快速链接 */
  quickLinks: [
    { title: "Features", href: "/features" },
    { title: "Pricing", href: "/pricing" },
    { title: "Documentation", href: "/docs" },
    { title: "Changelog", href: "/changelog" },
  ] as NavItem[],

  /** 资源链接 */
  resources: [
    { title: "Blog", href: "/blog" },
    { title: "Guides", href: "/guides" },
    { title: "Support", href: "/support" },
    { title: "API Reference", href: "/api" },
  ] as NavItem[],

  /** 法律链接 */
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
    title: "Application",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
  {
    title: "AI Demo",
    items: [
      {
        title: "Chat",
        href: "/dashboard/chat",
        icon: MessageSquare,
      },
      {
        title: "Image",
        href: "/dashboard/image",
        icon: Image,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        title: "工单支持",
        href: "/dashboard/support",
        icon: Headphones,
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
  productNav,
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
