/**
 * Sentry 客户端配置
 *
 * 此文件由 Next.js 自动加载
 * 仅在 NEXT_PUBLIC_SENTRY_DSN 配置后生效
 */

import { initSentryClient } from "@/lib/monitoring";

initSentryClient();
