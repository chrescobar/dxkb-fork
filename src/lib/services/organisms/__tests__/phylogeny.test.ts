import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import {
  fetchBacterialTreeXml,
  fetchViralFamilyBlock,
  resetPhylogenyCacheForTests,
  resolvePhylogenyUrl,
} from "../phylogeny";

const origin = "https://www.bv-brc.org";
const dictionaryUrl = `${origin}/api/content/bvbrc_phylogeny_tab/taxon_tree_dict.json`;

beforeEach(resetPhylogenyCacheForTests);

describe("phylogeny services", () => {
  it("distinguishes a missing bacterial tree from a failed request", async () => {
    server.use(http.get(dictionaryUrl, () => HttpResponse.json({ "562": "ecoli.xml" })));
    expect(await fetchBacterialTreeXml(2)).toBeNull();
  });

  it("fetches a bacterial tree selected by the dictionary", async () => {
    server.use(
      http.get(dictionaryUrl, () => HttpResponse.json({ "562": "ecoli.xml" })),
      http.get(`${origin}/api/content/bvbrc_phylogeny_tab/phyloxml/ecoli.xml`, () =>
        new HttpResponse("<phyloxml />", { headers: { "Content-Type": "application/xml" } })
      ),
    );
    expect(await fetchBacterialTreeXml(562)).toBe("<phyloxml />");
  });

  it("validates and normalizes a viral family block", async () => {
    const url = `${origin}/api/content/phyloxml_trees/families/2955291/2955291.json`;
    server.use(http.get(url, () => HttpResponse.json({
      order: ["flu"],
      groups: [{ key: "flu", title: "Influenza", archaeopteryx: [{ name: "HA", path: "/tree.xml" }] }],
    })));
    expect(await fetchViralFamilyBlock(2955291)).toEqual({
      order: ["flu"],
      groups: [{ key: "flu", title: "Influenza", archaeopteryx: [{ name: "HA", path: "/tree.xml" }], nextstrain: undefined }],
    });
  });

  it("parses absent, empty, populated, and malformed viewer arrays", async () => {
    const url = `${origin}/api/content/phyloxml_trees/families/2955291/2955291.json`;
    server.use(http.get(url, () => HttpResponse.json({
      groups: [
        { key: "missing", title: "Missing", archaeopteryx: [{ name: "XML", path: "/tree.xml" }] },
        { key: "empty", title: "Empty", archaeopteryx: [], nextstrain: [] },
        {
          key: "mixed",
          title: "Mixed",
          archaeopteryx: [{ name: "XML", path: "/mixed.xml" }, { bad: true }],
          nextstrain: [
            { name: "Auspice", path: "Influenza-A-Virus/H3N2/HA" },
            { name: "Missing path" },
          ],
        },
        { key: "nextstrain", title: "Nextstrain only", nextstrain: [{ name: "Tree", path: "Orthoebolavirus/100" }] },
        { key: "invalid-array", title: "Invalid array", nextstrain: {} },
      ],
    })));

    expect(await fetchViralFamilyBlock(2955291)).toEqual({
      groups: [
        {
          key: "missing",
          title: "Missing",
          archaeopteryx: [{ name: "XML", path: "/tree.xml" }],
          nextstrain: undefined,
        },
        {
          key: "mixed",
          title: "Mixed",
          archaeopteryx: [{ name: "XML", path: "/mixed.xml" }],
          nextstrain: [{ name: "Auspice", path: "Influenza-A-Virus/H3N2/HA" }],
        },
        {
          key: "nextstrain",
          title: "Nextstrain only",
          archaeopteryx: undefined,
          nextstrain: [{ name: "Tree", path: "Orthoebolavirus/100" }],
        },
      ],
    });
  });

  it("resolves relative HTTP URLs and rejects unsafe protocols", () => {
    expect(resolvePhylogenyUrl("/tree.xml")).toBe(`${origin}/tree.xml`);
    expect(resolvePhylogenyUrl("javascript:alert(1)")).toBeNull();
  });
});
