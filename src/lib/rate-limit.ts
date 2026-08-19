/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Suitable for this app because it runs as a single long-lived Node process
 * (standalone / PM2), so the counter map is shared across requests. It is
 * per-process and resets on restart — not durable and not shared across
 * multiple instances. For a horizontally-scaled deployment, back this with a
 * shared store (Redis/Upstash) instead.
 */

interface WindowState {
  count: number;
  /** Epoch ms when the current window expires. */
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window (0 when blocked). */
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
}

const buckets = new Map<string, WindowState>();

/**
 * Records a hit for `key` and reports whether it is within the allowed budget.
 *
 * @param key    Identifier to bucket by (e.g. client IP + route).
 * @param limit  Max requests permitted per window.
 * @param windowMs  Window length in milliseconds.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Best-effort client IP from proxy headers, falling back to "unknown".
 * The app sits behind a proxy (see src/proxy.ts), so x-forwarded-for is the
 * authoritative source.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First entry is the original client; the rest are proxy hops.
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
