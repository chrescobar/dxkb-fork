import { renderSingularShell } from "../render-singular";
import { viewRegistry } from "../view-registry";

const { notFoundSpy } = vi.hoisted(() => ({
  notFoundSpy: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
}));

describe("renderSingularShell id validation", () => {
  beforeEach(() => { notFoundSpy.mockClear(); });

  it("calls notFound for a list-only type", async () => {
    await expect(
      renderSingularShell(viewRegistry.strain, "anything", {}),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundSpy).toHaveBeenCalled();
  });

  it("calls notFound for a non-integer id when idKind is int", async () => {
    await expect(
      renderSingularShell(viewRegistry.taxonomy, "not-a-number", {}),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound for a zero/negative int id", async () => {
    await expect(renderSingularShell(viewRegistry.taxonomy, "0", {})).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(renderSingularShell(viewRegistry.taxonomy, "-5", {})).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound for an empty string id when idKind is string", async () => {
    await expect(renderSingularShell(viewRegistry.genome, "", {})).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
