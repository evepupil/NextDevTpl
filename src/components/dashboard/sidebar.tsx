"use client";

import {
  ChevronsUpDown,
  Image,
  LayoutDashboard,
  LogOut,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Application",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "AI Demo",
    items: [
      { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
      { href: "/dashboard/image", label: "Image", icon: Image },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // 获取当前用户会话
  const { data: session } = useSession();
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

  /**
   * 处理登出
   */
  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          NEXTDEVKIT
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 用户信息区域 */}
      <div className="border-t p-4">
        {user ? (
          <div className="space-y-2">
            {/* 用户信息 */}
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="bg-violet-600 text-white text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* 登出按钮 */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          // 加载状态或未登录状态
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
