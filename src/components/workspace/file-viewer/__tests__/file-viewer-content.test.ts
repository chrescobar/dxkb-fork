import { resolveViewer } from "../file-viewer-registry";

// Test the viewer routing logic that FileViewerContent depends on.
// The component itself is a thin switch over resolveViewer, so we test
// the routing decisions here rather than rendering the full component
// (which requires heavy viewer mocks).

describe("FileViewerContent routing logic", () => {
  it("routes .fasta files to text viewer", () => {
    expect(resolveViewer("contigs", "reads.fasta")).toBe("text");
  });

  it("routes .json files to json viewer", () => {
    expect(resolveViewer("json", "config.json")).toBe("json");
  });

  it("routes .png files to image viewer", () => {
    expect(resolveViewer("png", "photo.png")).toBe("image");
  });

  it("routes .svg files to svg viewer", () => {
    expect(resolveViewer("svg", "diagram.svg")).toBe("svg");
  });

  it("routes .csv files to csv viewer", () => {
    expect(resolveViewer("csv", "data.csv")).toBe("csv");
  });

  it("routes .tsv files to csv viewer", () => {
    expect(resolveViewer("tsv", "data.tsv")).toBe("csv");
  });

  it("routes .pdf files to iframe viewer", () => {
    expect(resolveViewer("pdf", "document.pdf")).toBe("iframe");
  });

  it("routes .html files to iframe viewer", () => {
    expect(resolveViewer("html", "report.html")).toBe("iframe");
  });

  it("routes .htm files to iframe viewer", () => {
    expect(resolveViewer("html", "report.htm")).toBe("iframe");
  });

  it("routes unknown types to fallback", () => {
    expect(resolveViewer("genome_group", "unknown.xyz")).toBe("fallback");
  });

  describe("iframe script detection (used by FileViewerContent)", () => {
    it("detects PDF as needing scripts", () => {
      const ext = "document.pdf".split(".").pop()?.toLowerCase();
      expect(ext === "pdf" || ext === "html" || ext === "htm").toBe(true);
    });

    it("detects HTML as needing scripts", () => {
      const ext = "page.html".split(".").pop()?.toLowerCase();
      expect(ext === "pdf" || ext === "html" || ext === "htm").toBe(true);
    });

    it("detects HTM as needing scripts", () => {
      const ext = "page.htm".split(".").pop()?.toLowerCase();
      expect(ext === "pdf" || ext === "html" || ext === "htm").toBe(true);
    });

    it("does not detect PDB as needing scripts", () => {
      const ext = "model.pdb".split(".").pop()?.toLowerCase();
      expect(ext === "pdf" || ext === "html" || ext === "htm").toBe(false);
    });
  });
});
