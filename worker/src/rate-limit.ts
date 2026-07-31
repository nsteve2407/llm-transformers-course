export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  record: RateLimitRecord;
}

export function decideRateLimit(
  existing: RateLimitRecord | null,
  now: number,
  limit: number,
  windowSeconds: number
): RateLimitDecision {
  const isExpired = !existing || now >= existing.resetAt;

  if (isExpired) {
    return { allowed: true, record: { count: 1, resetAt: now + windowSeconds } };
  }

  if (existing.count >= limit) {
    return { allowed: false, record: existing };
  }

  return {
    allowed: true,
    record: { count: existing.count + 1, resetAt: existing.resetAt },
  };
}
