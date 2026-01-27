"use client";

import { createContext, useContext, useState, useCallback } from "react";

/**
 * 侧边栏上下文类型
 */
interface SidebarContextType {
  /** 侧边栏是否折叠 */
  isCollapsed: boolean;
  /** 切换折叠状态 */
  toggleSidebar: () => void;
  /** 设置折叠状态 */
  setCollapsed: (collapsed: boolean) => void;
}

/**
 * 侧边栏上下文
 */
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * 侧边栏上下文提供者
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * 使用侧边栏上下文的 Hook
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
