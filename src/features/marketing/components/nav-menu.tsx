"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { mainNav, productNav } from "@/config";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Mega Menu 列表项组件
 */
interface ListItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}

function ListItem({ icon: Icon, title, description, href }: ListItemProps) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "flex select-none gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          )}
        >
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {description}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

/**
 * 滑动胶囊导航菜单组件
 *
 * 包含 Products Mega Menu 和其他导航链接
 * 使用 Framer Motion 实现平滑的背景滑动动画
 */
export function NavMenu() {
  const pathname = usePathname();
  const tNav = useTranslations("Header.nav");
  const tProducts = useTranslations("Header.products");
  // 当前悬停的导航项 (不包括 Products 下拉菜单)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navLabels: Record<string, string> = {
    "/docs": tNav("docs"),
    "/#pricing": tNav("pricing"),
    "/pricing": tNav("pricing"),
    "/blog": tNav("blog"),
    "/about": tNav("about"),
  };

  /**
   * 检查链接是否处于激活状态
   */
  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return false;
    }
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, "") || "/";
    return cleanPath === href || cleanPath.startsWith(`${href}/`);
  };

  /**
   * 处理锚点链接点击
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      const anchor = href.substring(2);
      const isHomePage = pathname === "/" || pathname.match(/^\/[a-z]{2}$/);

      if (isHomePage) {
        e.preventDefault();
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <NavigationMenu onMouseLeave={() => setHoveredItem(null)}>
      <NavigationMenuList className="gap-0">
        {/* Products Mega Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
            {tNav("products")}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[750px] grid-cols-3 gap-3 p-4">
              {Object.entries(productNav).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <h4 className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tProducts(`${groupKey}.title`)}
                  </h4>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const slug = item.href.split("/").filter(Boolean).pop() ?? "";
                      const titleKey = `${groupKey}.items.${slug}.title`;
                      const descriptionKey = `${groupKey}.items.${slug}.description`;

                      return (
                        <ListItem
                          key={item.href}
                          icon={item.icon}
                          title={tProducts(titleKey)}
                          description={tProducts(descriptionKey)}
                          href={item.href}
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* 主导航链接 - 带滑动胶囊动画 */}
        {mainNav.map((item) => {
          const active = isActive(item.href);

          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  className={cn(
                    "relative inline-flex h-9 items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* 滑动背景胶囊 */}
                  {hoveredItem === item.href && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-md bg-muted"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}

                  {/* 激活状态指示器 */}
                  {active && !hoveredItem && (
                    <motion.span
                      className="absolute inset-0 -z-10 rounded-md bg-muted/50"
                    />
                  )}

                  {navLabels[item.href] ?? item.title}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
