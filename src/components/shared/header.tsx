"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { mainNav, productNav, siteConfig } from "@/config";
import { useSession } from "@/lib/auth/client";
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
 * Marketing 页面顶部导航栏
 *
 * 功能:
 * - Logo 和站点名称
 * - Products Mega Menu
 * - 主导航链接
 * - 认证状态显示
 */
export function Header() {
  // 获取当前用户会话状态
  const { data: session, isPending } = useSession();
  const user = session?.user;

  /**
   * 获取用户名首字母作为头像回退
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">{siteConfig.name}</span>
          </Link>

          {/* 导航菜单 */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Products Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Products
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[750px] grid-cols-3 gap-3 p-4">
                    {/* 遍历产品分组 */}
                    {Object.values(productNav).map((group) => (
                      <div key={group.title}>
                        <h4 className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {group.title}
                        </h4>
                        <ul className="space-y-1">
                          {group.items.map((item) => (
                            <ListItem key={item.title} {...item} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* 主导航链接 */}
              {mainNav.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none">
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* 右侧认证区域 */}
        <div className="flex items-center gap-4">
          {isPending ? (
            // 加载状态 - 显示骨架
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            // 已登录 - 显示 Dashboard 按钮和头像
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Link href="/dashboard">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-violet-600 text-white text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            // 未登录 - 显示登录和注册按钮
            <>
              <Link
                href="/sign-in"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block"
              >
                Log in
              </Link>
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
