import { renderHook } from "@testing-library/react";
import { useAuthStyles } from "@/hooks/use-auth-styles";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: { isAuthenticated: false, isLoading: false } }));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockAuth,
}));
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.flat().filter(Boolean).join(" "),
}));

describe("useAuthStyles", () => {
  beforeEach(() => {
    Object.assign(mockAuth, { isAuthenticated: false, isLoading: false });
  });

  describe("authClass", () => {
    it("returns authenticatedClass when authenticated", () => {
      Object.assign(mockAuth, { isAuthenticated: true, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.authClass("auth-yes", "auth-no")).toBe("auth-yes");
    });

    it("returns unauthenticatedClass when not authenticated", () => {
      Object.assign(mockAuth, { isAuthenticated: false, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.authClass("auth-yes", "auth-no")).toBe("auth-no");
    });
  });

  describe("whenAuthenticated", () => {
    it("returns the class when authenticated", () => {
      Object.assign(mockAuth, { isAuthenticated: true, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenAuthenticated("visible")).toBe("visible");
    });

    it("returns empty string when not authenticated", () => {
      Object.assign(mockAuth, { isAuthenticated: false, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenAuthenticated("visible")).toBe("");
    });
  });

  describe("whenUnauthenticated", () => {
    it("returns the class when not authenticated", () => {
      Object.assign(mockAuth, { isAuthenticated: false, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenUnauthenticated("hidden")).toBe("hidden");
    });

    it("returns empty string when authenticated", () => {
      Object.assign(mockAuth, { isAuthenticated: true, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenUnauthenticated("hidden")).toBe("");
    });
  });

  describe("whenLoading", () => {
    it("returns the class when loading", () => {
      Object.assign(mockAuth, { isAuthenticated: false, isLoading: true });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenLoading("spinner")).toBe("spinner");
    });

    it("returns empty string when not loading", () => {
      Object.assign(mockAuth, { isAuthenticated: false, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      expect(result.current.whenLoading("spinner")).toBe("");
    });
  });

  describe("authClasses", () => {
    it("combines classes where condition is true", () => {
      Object.assign(mockAuth, { isAuthenticated: true, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      const classes = result.current.authClasses({
        "text-green": true,
        "bg-red": false,
        "font-bold": true,
      });

      expect(classes).toContain("text-green");
      expect(classes).toContain("font-bold");
      expect(classes).not.toContain("bg-red");
    });

    it("returns empty string when all conditions are false", () => {
      Object.assign(mockAuth, { isAuthenticated: false, isLoading: false });
      const { result } = renderHook(() => useAuthStyles());

      const classes = result.current.authClasses({
        "hidden-class": false,
        "other-class": false,
      });

      expect(classes).toBe("");
    });
  });
});
