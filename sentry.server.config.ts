/**
 * Sentry 服务端配置
 *
 * 此文件由 Next.js 自动加载
 * 仅在 NEXT_PUBLIC_SENTRY_DSN 配置后生效
 */

import { initSentryServer } from "@/lib/monitoring";

initSentryServer();
