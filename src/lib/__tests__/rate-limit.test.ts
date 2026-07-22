import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, clientIp } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit then blocks", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 3, 1000)).toMatchObject({ allowed: true, remaining: 2 });
    expect(rateLimit(key, 3, 1000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(rateLimit(key, 3, 1000)).toMatchObject({ allowed: true, remaining: 0 });
    expect(rateLimit(key, 3, 1000)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 1, 1000);
    expect(rateLimit(key, 1, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 1, 1000).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, 1, 1000);
    expect(rateLimit(a, 1, 1000).allowed).toBe(false);
    expect(rateLimit(b, 1, 1000).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.5" },
    });
    expect(clientIp(req)).toBe("198.51.100.5");
  });

  it("returns 'unknown' when no ip headers are present", () => {
    const req = new Request("https://example.com");
    expect(clientIp(req)).toBe("unknown");
  });
});
