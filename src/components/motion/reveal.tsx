"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** 全站统一缓动（与 Hero 入场一致） */
export const EASE: [number, number, number, number] = [0.22, 0.7, 0.16, 1];

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** 入场延迟（秒），用于同区块内错峰 */
  delay?: number;
  /** 初始 Y 位移（px） */
  y?: number;
}

/**
 * 滚动进入视口时淡入上浮的一次性入场动画。
 *
 * - once: true —— 只触发一次，滚回去不重复
 * - viewport margin 让动画在元素进入视口 10% 时就触发，更跟手
 * - 自动尊重 prefers-reduced-motion：减弱动效用户直接渲染静态内容，
 *   不做位移/淡入（避免可访问性问题）
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
