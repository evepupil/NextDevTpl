/**
 * 匿名用户限流工具
 *
 * 基于 IP 地址 + 可选的设备指纹进行限流
 * 使用 Redis 存储计数
 */

import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * 获取 Upstash Redis 实例
 */
function getRedisClient(): Redis | null {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
  }
  return null;
}

/**
 * 匿名用户配额配置
 */
const ANONYMOUS_QUOTA = {
  MAX_GENERATIONS: 2, // 每个设备最多生成次数
  WINDOW_HOURS: 24, // 时间窗口（小时）
  PREFIX: "anonymous:", // Redis key 前缀
};

/**
 * 生成 Redis key
 */
function getRateLimitKey(identifier: string): string {
  return `${ANONYMOUS_QUOTA.PREFIX}${identifier}`;
}

// Thread-local storage for fingerprint passed from action
let requestFingerprint: string | null = null;

/**
 * Set fingerprint for the current request
 * Called from server actions that receive fingerprint from client
 */
export function setFingerprintForRequest(fingerprint: string) {
  requestFingerprint = fingerprint;
}

/**
 * 获取客户端标识符
 *
 * 优先级：
 * 1. 设备指纹（如果有 - from action input or header）
 * 2. IP 地址
 * 3. 随机 session ID（fallback）
 */
export async function getClientIdentifier(): Promise<string> {
  try {
    // First check if fingerprint was set via action input
    if (requestFingerprint) {
      const fp = requestFingerprint;
      // Clear for next request
      requestFingerprint = null;
      return `fp:${fp}`;
    }

    const headersList = await headers();

    // 尝试从 header 获取设备指纹（客户端通过 X-Device-Fingerprint 发送）
    const fingerprint = headersList.get("x-device-fingerprint");
    if (fingerprint) {
      return `fp:${fingerprint}`;
    }

    // 使用 IP 地址
    const ip = headersList.get("x-forwarded-for") ||
               headersList.get("x-real-ip") ||
               headersList.get("cf-connecting-ip") ||
               "unknown";

    // 简单的 IP 匿名化（去掉最后一段）
    const anonymizedIp = ip.replace(/(\d+\.\d+\.\d+)\.\d+/, "$1.0");
    return `ip:${anonymizedIp}`;
  } catch {
    return `unknown:${Date.now()}`;
  }
}

/**
 * 检查匿名用户是否有配额
 *
 * @returns 是否允许生成
 */
export async function checkAnonymousQuota(): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
  const redis = getRedisClient();

  if (!redis) {
    // Redis 不可用时，通过内存限制（仅用于开发）
    console.warn("Redis not available, using fallback rate limiting");
    return { allowed: true, remaining: ANONYMOUS_QUOTA.MAX_GENERATIONS };
  }

  try {
    const identifier = await getClientIdentifier();
    const key = getRateLimitKey(identifier);

    // 获取当前计数
    const current = await redis.get<number>(key) ?? 0;

    if (current >= ANONYMOUS_QUOTA.MAX_GENERATIONS) {
      // 获取过期时间
      const ttl = await redis.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);
      return { allowed: false, remaining: 0, resetAt };
    }

    const remaining = ANONYMOUS_QUOTA.MAX_GENERATIONS - current;
    return { allowed: true, remaining };
  } catch (error) {
    console.error("Error checking quota:", error);
    // 出错时允许继续（降级策略）
    return { allowed: true, remaining: ANONYMOUS_QUOTA.MAX_GENERATIONS };
  }
}

/**
 * 增加匿名用户使用计数
 *
 * @returns 新的计数
 */
export async function incrementAnonymousUsage(): Promise<number> {
  const redis = getRedisClient();

  if (!redis) {
    return 0;
  }

  try {
    const identifier = await getClientIdentifier();
    const key = getRateLimitKey(identifier);

    // 增加计数
    const newCount = await redis.incr(key);

    // 第一次设置时，添加过期时间
    if (newCount === 1) {
      const ttlSeconds = ANONYMOUS_QUOTA.WINDOW_HOURS * 3600;
      await redis.expire(key, ttlSeconds);
    }

    return newCount;
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return 0;
  }
}

/**
 * 获取匿名用户剩余配额
 */
export async function getRemainingQuota(): Promise<number> {
  const redis = getRedisClient();

  if (!redis) {
    return ANONYMOUS_QUOTA.MAX_GENERATIONS;
  }

  try {
    const identifier = await getClientIdentifier();
    const key = getRateLimitKey(identifier);
    const current = await redis.get<number>(key) ?? 0;
    return Math.max(0, ANONYMOUS_QUOTA.MAX_GENERATIONS - current);
  } catch {
    return ANONYMOUS_QUOTA.MAX_GENERATIONS;
  }
}
