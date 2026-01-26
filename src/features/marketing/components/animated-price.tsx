"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * 动画价格组件属性
 */
interface AnimatedPriceProps {
  /** 目标价格值 */
  value: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 动画价格组件
 *
 * 使用 Framer Motion 实现价格数字的平滑跳动效果
 * 当价格变化时，数字会以弹簧动画的方式过渡到新值
 */
export function AnimatedPrice({ value, className }: AnimatedPriceProps) {
  // 使用 spring 动画实现平滑过渡
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 20,
    mass: 1,
  });

  // 将 spring 值转换为显示格式（取整）
  const display = useTransform(spring, (latest) => Math.round(latest));

  // 当 value 变化时更新 spring 目标值
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}
