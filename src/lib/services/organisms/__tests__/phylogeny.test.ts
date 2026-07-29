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

  it("resolves relative HTTP URLs and rejects unsafe protocols", () => {
    expect(resolvePhylogenyUrl("/tree.xml")).toBe(`${origin}/tree.xml`);
    expect(resolvePhylogenyUrl("javascript:alert(1)")).toBeNull();
  });
});
