import { renderHook } from "@testing-library/react";
import { useAuthStyles } from "@/hooks/use-auth-styles";

let mockAuth = { isAuthenticated: false, isLoading: false };
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockAuth,
}));
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.flat().filter(Boolean).join(" "),
}));

describe("useAuthStyles", () => {
  beforeEach(() => {
    mockAuth = { isAuthenticated: false, isLoading: false };
  });

  describe("authClass", () => {
    it("returns authenticatedClass when authenticated", () => {
      mockAuth = { isAuthenticated: true, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.authClass("auth-yes", "auth-no")).toBe("auth-yes");
    });

    it("returns unauthenticatedClass when not authenticated", () => {
      mockAuth = { isAuthenticated: false, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.authClass("auth-yes", "auth-no")).toBe("auth-no");
    });
  });

  describe("whenAuthenticated", () => {
    it("returns the class when authenticated", () => {
      mockAuth = { isAuthenticated: true, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenAuthenticated("visible")).toBe("visible");
    });

    it("returns empty string when not authenticated", () => {
      mockAuth = { isAuthenticated: false, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenAuthenticated("visible")).toBe("");
    });
  });

  describe("whenUnauthenticated", () => {
    it("returns the class when not authenticated", () => {
      mockAuth = { isAuthenticated: false, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenUnauthenticated("hidden")).toBe("hidden");
    });

    it("returns empty string when authenticated", () => {
      mockAuth = { isAuthenticated: true, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenUnauthenticated("hidden")).toBe("");
    });
  });

  describe("whenLoading", () => {
    it("returns the class when loading", () => {
      mockAuth = { isAuthenticated: false, isLoading: true };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenLoading("spinner")).toBe("spinner");
    });

    it("returns empty string when not loading", () => {
      mockAuth = { isAuthenticated: false, isLoading: false };
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenLoading("spinner")).toBe("");
    });
  });
});
