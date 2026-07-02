"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

/**
 * 缓动曲线（全站统一）+ 入场动画变体
 */
const EASE: [number, number, number, number] = [0.22, 0.7, 0.16, 1];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * Hero Section —— 工程图纸风首页主视觉
 *
 * 左：eyebrow + 大标题（主色高亮下划线）+ 副标题 + CTA + 真实仓库指标
 * 右：生产环境读数面板（指标 + 折线 + 状态药丸），展示 dashboard 级精致度
 */
export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden">
      {/* 氛围层：双色光晕 + 极淡网格（顶部渐隐） */}
      <div
        aria-hidden
        className="aura pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(72%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="container grid items-center gap-14 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* 左列 */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start"
        >
          <motion.span variants={itemVariants} className="eyebrow">
            {t("eyebrow")}
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="mt-6 text-4xl font-extrabold tracking-tight text-balance text-foreground text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02]"
          >
            <span className="block">{t("title1")}</span>
            <span className="block">
              <span className="relative inline-block text-primary">
                {t("titleHighlight")}
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-[6px] rounded-sm bg-primary/20"
                />
              </span>
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button size="lg" asChild className="group">
              <Link href="/sign-up">
                {t("getStarted")}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#features">{t("seeDemo")}</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-10 grid w-full max-w-lg grid-cols-2 gap-x-8 gap-y-5 border-t pt-7 sm:grid-cols-4"
          >
            <Stat k="18" v={t("meta.modules")} />
            <Stat k="256" v={t("meta.tests")} />
            <Stat k="0" v={t("meta.errors")} />
            <Stat k="MIT" v={t("meta.license")} />
          </motion.div>
        </motion.div>

        {/* 右列：生产环境读数面板 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
        >
          <ProductionPanel />
        </motion.div>
      </div>
    </section>
  );
}

/** 指标小卡（左侧大数字 + 标签） */
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="mono-data text-2xl font-bold tracking-tight text-foreground">
        {k}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{v}</div>
    </div>
  );
}

/** 面板内的指标单元 */
function Metric({
  delta,
  label,
  unit,
  value,
}: {
  delta: string;
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <div className="p-3.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border">
      <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
        {label}
      </div>
      <div className="mono-data mt-2 text-xl font-bold tracking-tight text-foreground">
        {value}
        {unit ? (
          <span className="text-xs text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-primary">{delta}</div>
    </div>
  );
}

/** 状态药丸 */
function Pill({ children, ok = false }: { children: ReactNode; ok?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${
        ok
          ? "border-primary/30 text-foreground"
          : "border-border text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-primary" : "bg-muted-foreground/40"}`}
      />
      {children}
    </span>
  );
}

/** Hero 右侧：生产环境读数面板（含 canvas 折线图） */
function ProductionPanel() {
  const t = useTranslations("Hero.panel");
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // resolvedTheme 是有意依赖：主题切换后 CSS 变量（--primary 等）变化，
  // 需要用新颜色重画 canvas。effect 内部通过 getComputedStyle 间接读取颜色，
  // Biome 检测不到这层依赖，故显式保留并抑制告警。
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional theme-driven redraw
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = 72;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const data = [8, 12, 9, 14, 11, 16, 13, 18, 15, 20, 17, 22, 19, 28, 26, 32];
    const max = Math.max(...data);
    const min = Math.min(...data);
    const pad = 8;
    const X = (i: number) => (i / (data.length - 1)) * (w - pad * 2) + pad;
    const Y = (v: number) =>
      h - pad - ((v - min) / (max - min)) * (h - pad * 2);

    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue("--primary").trim() || "#0F5C57";
    const hair = cs.getPropertyValue("--border").trim() || "#ddd";

    // 基线
    ctx.strokeStyle = hair;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - pad + 0.5);
    ctx.lineTo(w, h - pad + 0.5);
    ctx.stroke();

    // 区域填充
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `${accent}55`);
    grad.addColorStop(1, `${accent}00`);
    ctx.beginPath();
    ctx.moveTo(X(0), h - pad);
    data.forEach((v, i) => {
      ctx.lineTo(X(i), Y(v));
    });
    ctx.lineTo(X(data.length - 1), h - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 折线
    ctx.beginPath();
    data.forEach((v, i) => {
      if (i === 0) ctx.moveTo(X(i), Y(v));
      else ctx.lineTo(X(i), Y(v));
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.stroke();

    // 强调终点
    const last = data[data.length - 1] ?? 0;
    const lx = X(data.length - 1);
    const ly = Y(last);
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fillStyle = `${accent}22`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  }, [resolvedTheme]);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lifted">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
      />
      {/* 面板头 */}
      <div className="relative flex items-center gap-2.5 border-b px-5 py-3.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {t("title")}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
          {t("region")}
        </span>
      </div>

      {/* 指标行 */}
      <div className="relative space-y-4 p-5">
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border bg-card">
          <Metric delta="↓ 12" label={t("p95")} unit="ms" value="84" />
          <Metric delta="30d" label={t("uptime")} unit="%" value="99.98" />
          <Metric delta="↑ 8%" label={t("jobs")} value="1,420" />
        </div>

        {/* 折线 */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t("signups")}
            </span>
            <span className="mono-data text-lg font-bold text-foreground">
              3,284{" "}
              <span className="text-xs font-semibold text-primary">+24%</span>
            </span>
          </div>
          <canvas ref={canvasRef} className="mt-2 h-[72px] w-full" />
        </div>
      </div>

      {/* 状态药丸 */}
      <div className="relative flex flex-wrap gap-2 border-t bg-muted/30 px-5 py-3">
        <Pill ok>{t("pillOk")}</Pill>
        <Pill>{t("pillStack")}</Pill>
      </div>
    </div>
  );
}
