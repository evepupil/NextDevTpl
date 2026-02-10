"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useSession } from "./client";

/**
 * 会话用户类型
 */
interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  emailVerified: boolean;
}

/**
 * 会话上下文类型
 */
interface SessionContextType {
  /** 当前用户，未登录时为 null */
  user: SessionUser | null;
  /** 是否正在加载会话 */
  isLoading: boolean;
  /** 是否已认证 */
  isAuthenticated: boolean;
}

/**
 * 会话上下文
 */
const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * 会话提供者组件
 *
 * 包裹应用根组件，提供全局会话状态
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { SessionProvider } from "@/lib/auth/session-context";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SessionProvider>{children}</SessionProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: SessionContextType = {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/**
 * 使用会话上下文的 Hook
 *
 * @returns 会话上下文值
 * @throws 如果在 SessionProvider 外部使用
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isLoading, isAuthenticated } = useSessionContext();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!isAuthenticated) return <LoginButton />;
 *
 *   return <div>Welcome, {user.name}</div>;
 * }
 * ```
 */
export function useSessionContext() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error("useSessionContext 必须在 SessionProvider 内部使用");
  }

  return context;
}
