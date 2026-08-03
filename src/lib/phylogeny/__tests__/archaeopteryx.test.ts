import { loadArchaeopteryx } from "../archaeopteryx";

describe("loadArchaeopteryx", () => {
  it("initializes the complete legacy runtime on one jQuery instance", async () => {
    const { archaeopteryx, forester } = await loadArchaeopteryx();
    const jquery = (window as Window & { jQuery?: { widget?: unknown } })
      .jQuery;

    expect(jquery?.widget).toBeTypeOf("function");
    expect(typeof archaeopteryx.parsePhyloXML).toBe("function");
    expect(typeof archaeopteryx.launch).toBe("function");
    expect(typeof forester.collectPropertyRefs).toBe("function");
  });
});
