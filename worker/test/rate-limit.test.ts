import { describe, it, expect } from "vitest";
import { decideRateLimit } from "../src/rate-limit";

describe("decideRateLimit", () => {
  it("allows the first request and starts a new window", () => {
    const result = decideRateLimit(null, 1000, 20, 3600);
    expect(result.allowed).toBe(true);
    expect(result.record.count).toBe(1);
    expect(result.record.resetAt).toBe(1000 + 3600);
  });

  it("allows requests under the limit within the same window", () => {
    const existing = { count: 5, resetAt: 5000 };
    const result = decideRateLimit(existing, 1200, 20, 3600);
    expect(result.allowed).toBe(true);
    expect(result.record.count).toBe(6);
    expect(result.record.resetAt).toBe(5000);
  });

  it("denies requests once the limit is reached within the window", () => {
    const existing = { count: 20, resetAt: 5000 };
    const result = decideRateLimit(existing, 1200, 20, 3600);
    expect(result.allowed).toBe(false);
    expect(result.record.count).toBe(20);
  });

  it("resets the window once resetAt has passed", () => {
    const existing = { count: 20, resetAt: 1000 };
    const result = decideRateLimit(existing, 1500, 20, 3600);
    expect(result.allowed).toBe(true);
    expect(result.record.count).toBe(1);
    expect(result.record.resetAt).toBe(1500 + 3600);
  });
});
