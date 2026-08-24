import React from "react";
import "@testing-library/jest-dom/vitest";

// vitest's populateGlobal skips localStorage/sessionStorage because Node.js v22+
// already defines them (as broken experimental APIs). Explicitly re-bind to jsdom's
// working implementations via global.jsdom, which vitest always sets for the jsdom
// environment. Done in beforeAll so jsdom is guaranteed to be initialized.
beforeAll(() => {
  const dom = (global as unknown as { jsdom?: { window: Window & typeof globalThis } }).jsdom;
  if (dom) {
    vi.stubGlobal("localStorage", dom.window.localStorage);
    vi.stubGlobal("sessionStorage", dom.window.sessionStorage);
  }
});


const { clearTestCookies, testCookieStore } = await import(
  "@/test-helpers/api-route-helpers"
);

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(testCookieStore)),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: Record<string, unknown>) =>
    React.createElement("img", { src, alt, ...rest }),
}));

// Suppress console.error noise in tests (auto-restored by restoreMocks)
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

// MSW server lifecycle — strict mode rejects any unhandled fetch calls
import { server } from "@/test-helpers/msw-server";
beforeAll(() => { server.listen({ onUnhandledRequest: "error" }); });
afterEach(() => {
  server.resetHandlers();
  clearTestCookies();
});
afterAll(() => { server.close(); });
