import { render } from "@testing-library/react";

import { makeListPage, makeSingularPage } from "../page-factory";
import { viewRegistry } from "../view-registry";

const { notFoundSpy } = vi.hoisted(() => ({
  notFoundSpy: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
}));

beforeEach(() => {
  notFoundSpy.mockClear();
});

describe("makeListPage", () => {
  it("returns a callable that renders the list shell with friendly rql", async () => {
    const page = makeListPage(viewRegistry.genome);
    render(await page({ searchParams: Promise.resolve({ keyword: "flu" }) }));
    expect(document.body.textContent).toContain("keyword(flu)");
  });
});

describe("makeSingularPage", () => {
  it("extracts the named param and returns the singular shell element", async () => {
    const page = makeSingularPage(viewRegistry.genome, "genomeId");
    const element = await page({
      params: Promise.resolve({ genomeId: "59201.7581" }),
      searchParams: Promise.resolve({}),
    });
    expect(element).toBeTruthy();
  });

  it("calls notFound when the extracted id is invalid", async () => {
    const page = makeSingularPage(viewRegistry.genome, "genomeId");
    await expect(
      page({ params: Promise.resolve({ genomeId: "" }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundSpy).toHaveBeenCalled();
  });
});
