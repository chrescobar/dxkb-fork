import { renderHook } from "@testing-library/react";
import { useIsMounted } from "@/hooks/use-is-mounted";

vi.mock("@/lib/utils", () => ({
  noop: () => {
    /* no-op */
  },
}));

describe("useIsMounted", () => {
  it("returns true in a client (jsdom) environment", () => {
    const { result } = renderHook(() => useIsMounted());

    expect(result.current).toBe(true);
  });
});
