/**
 * Integration tests for ListData network behaviour with resource="ppi".
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import React from "react";

import { server } from "@/test-helpers/msw-server";
import { ListData } from "../list-data";

const dataApi = "https://test-bvbrc-api.example.com";
const ppiQuery = "and(eq(genome_id_a,*),genome(to(genome_id_a),and(eq(taxon_lineage_ids,234),ne(genome_status,Deprecated))),eq(evidence,experimental))";

const ppiRow = {
  id: "ppi-1",
  genome_id_a: "224914.16",
  genome_name_a: "Brucella melitensis bv. 1 str. 16M [WGS]",
  interactor_a: "fig|224914.16.peg.635",
  feature_id_a: "PATRIC.224914.16.NZ_GG703778.CDS.1084382.1084843.fwd",
  refseq_locus_tag_a: "BAWG_1022",
  gene_a: "",
  interactor_desc_a: "6,7-dimethyl-8-ribityllumazine synthase",
  genome_id_b: "224914.16",
  genome_name_b: "Brucella melitensis bv. 1 str. 16M [WGS]",
  interactor_b: "fig|224914.16.peg.2425",
  category: "PPI",
  interaction_type: ["predicted interaction"],
  detection_method: ["predictive text mining"],
  evidence: ["experimental"],
  score: 2.5316925,
};

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATA_API = dataApi;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_API;
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { Wrapper };
}

describe("ListData ppi", () => {
  it("renders ppi rows for the taxon join query", async () => {
    server.use(
      http.get(`${dataApi}/ppi/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 1 } });
        }
        return HttpResponse.json([ppiRow]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="ppi" q={ppiQuery} />
      </Wrapper>
    );

    expect(await screen.findByText(/Showing 1-1 of 1 results/)).toBeInTheDocument();
  });

  it("sends limit(1) on the count request", async () => {
    const countUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/ppi/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          countUrls.push(request.url);
          return HttpResponse.json({ response: { numFound: 1 } });
        }
        return HttpResponse.json([ppiRow]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="ppi" q={ppiQuery} />
      </Wrapper>
    );

    await waitFor(() => { expect(countUrls.length).toBeGreaterThan(0); });

    expect(countUrls[0]).toContain("limit(1)");
    expect(countUrls[0]).toContain("ppi");
  });

  it("select() clause includes ppi A/B fields", async () => {
    const capturedDataUrls: string[] = [];

    server.use(
      http.get(`${dataApi}/ppi/`, ({ request }) => {
        if (request.url.includes("limit(1)")) {
          return HttpResponse.json({ response: { numFound: 5 } });
        }
        capturedDataUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = makeWrapper();
    render(
      <Wrapper>
        <ListData resource="ppi" q={ppiQuery} />
      </Wrapper>
    );

    await waitFor(() => { expect(capturedDataUrls.length).toBeGreaterThan(0); });

    const selectMatch = (capturedDataUrls[0] ?? "").match(/&select\(([^)]+)\)/);
    const selectedFields = (selectMatch?.[1] ?? "").split(",");

    expect(selectedFields).toContain("id");
    expect(selectedFields).toContain("genome_id_a");
    expect(selectedFields).toContain("interactor_a");
    expect(selectedFields).toContain("genome_id_b");
    expect(selectedFields).toContain("interactor_b");
    expect(selectedFields).toContain("date_modified");
  });
});
