import { getLanguageExtension } from "../codemirror-languages";

describe("getLanguageExtension", () => {
  it("returns a LanguageSupport for .json", async () => {
    const ext = await getLanguageExtension("data.json");
    expect(ext).not.toBeNull();
  });

  it("returns a LanguageSupport for .py", async () => {
    const ext = await getLanguageExtension("script.py");
    expect(ext).not.toBeNull();
  });

  it("returns a LanguageSupport for .ts", async () => {
    const ext = await getLanguageExtension("index.ts");
    expect(ext).not.toBeNull();
  });

  it("returns a LanguageSupport for .html", async () => {
    const ext = await getLanguageExtension("page.html");
    expect(ext).not.toBeNull();
  });

  it("returns a LanguageSupport for .md", async () => {
    const ext = await getLanguageExtension("readme.md");
    expect(ext).not.toBeNull();
  });

  it("returns a LanguageSupport for .xml and .gff (both map to xml)", async () => {
    const xml = await getLanguageExtension("config.xml");
    const gff = await getLanguageExtension("data.gff");
    expect(xml).not.toBeNull();
    expect(gff).not.toBeNull();
  });

  it("returns null for unknown extensions", async () => {
    expect(await getLanguageExtension("file.fasta")).toBeNull();
    expect(await getLanguageExtension("data.xyz")).toBeNull();
  });

  it("returns null for files with no extension", async () => {
    expect(await getLanguageExtension("Makefile")).toBeNull();
  });

  it("handles uppercase extensions by lowercasing", async () => {
    const ext = await getLanguageExtension("Config.JSON");
    expect(ext).not.toBeNull();
  });

  it("uses last dot for extension detection", async () => {
    const ext = await getLanguageExtension("archive.tar.json");
    expect(ext).not.toBeNull();
  });
});
