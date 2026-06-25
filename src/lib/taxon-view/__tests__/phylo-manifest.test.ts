// src/lib/taxon-view/__tests__/phylo-manifest.test.ts
import { http, HttpResponse } from "msw";

import { server } from "@/test-helpers/msw-server";
import { fetchPhyloManifest } from "../phylo-manifest";

const manifestUrl = "https://example.test/phylo/manifest.json";

afterEach(() => {
  delete process.env.PHYLO_MANIFEST_URL;
});

describe("fetchPhyloManifest", () => {
  it("returns an empty manifest (no network) when the env var is unset", async () => {
    const result = await fetchPhyloManifest();
    expect(result).toEqual({ trees: {} });
  });

  it("parses the manifest on a successful fetch", async () => {
    process.env.PHYLO_MANIFEST_URL = manifestUrl;
    server.use(
      http.get(manifestUrl, () =>
        HttpResponse.json({ trees: { "2955291": { url: "/trees/flu.nwk" } } }),
      ),
    );
    const result = await fetchPhyloManifest();
    expect(result?.trees["2955291"]).toBeDefined();
  });

  it("fails open (null) on a non-OK response", async () => {
    process.env.PHYLO_MANIFEST_URL = manifestUrl;
    server.use(http.get(manifestUrl, () => new HttpResponse(null, { status: 503 })));
    expect(await fetchPhyloManifest()).toBeNull();
  });

  it("fails open (null) on a network error", async () => {
    process.env.PHYLO_MANIFEST_URL = manifestUrl;
    server.use(http.get(manifestUrl, () => HttpResponse.error()));
    expect(await fetchPhyloManifest()).toBeNull();
  });

  it("fails open (null) when the body is the wrong shape", async () => {
    process.env.PHYLO_MANIFEST_URL = manifestUrl;
    server.use(http.get(manifestUrl, () => HttpResponse.json({ notTrees: 1 })));
    expect(await fetchPhyloManifest()).toBeNull();
  });
});
