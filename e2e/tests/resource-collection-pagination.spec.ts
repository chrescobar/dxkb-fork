import type { JsonOverride } from "../mocks/backends";
import { applyBackendMocks, expect, test } from "../mocks/backends";
import { permissiveBackendOverrides } from "../fixtures/overrides";
import { ResourceCollectionPage } from "../pages";

test.use({ storageState: { cookies: [], origins: [] } });

const cases = [
  {
    route: "genome",
    resource: "genome",
    keyword: "influenza",
    id: "1282460.2049",
    detailText: "Selected genome",
    firstRow: {
      genome_id: "1282460.2049",
      genome_name: "Selected genome",
    },
    secondRow: { genome_id: "1282460.2050", genome_name: "Next genome" },
  },
  {
    route: "feature",
    resource: "genome_feature",
    keyword: "influenza",
    id: "PATRIC.1282460.2049.JX869059.CDS.1.100.fwd",
    detailText: "Selected feature",
    firstRow: {
      feature_id: "PATRIC.1282460.2049.JX869059.CDS.1.100.fwd",
      patric_id: "fig|1282460.2049.peg.1",
      product: "Selected feature",
    },
    secondRow: {
      feature_id: "PATRIC.1282460.2049.JX869059.CDS.101.200.fwd",
      patric_id: "fig|1282460.2049.peg.2",
      product: "Next feature",
    },
  },
  {
    route: "epitope",
    resource: "epitope",
    keyword: "influenza",
    id: "15780",
    detailText: "SELECTED",
    firstRow: { epitope_id: "15780", epitope_sequence: "SELECTED" },
    secondRow: { epitope_id: "15781", epitope_sequence: "NEXT" },
  },
  {
    route: "surveillance",
    resource: "surveillance",
    keyword: "influenza",
    id: "surveillance-backend-901",
    detailText: "selected-sample",
    firstRow: {
      id: "surveillance-backend-901",
      sample_identifier: "selected-sample",
      pathogen_test_type: ["PCR"],
    },
    secondRow: {
      id: "surveillance-backend-902",
      sample_identifier: "next-sample",
      pathogen_test_type: ["PCR"],
    },
  },
] as const;

for (const testCase of cases) {
  test(`${testCase.route} preserves selection and prefetches the next page`, async ({
    page,
  }) => {
    const collectionRequests: number[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        url.pathname === `/api/data/${testCase.resource}` &&
        url.searchParams.get("operation") === "collection"
      ) {
        collectionRequests.push(Number(url.searchParams.get("page")));
      }
    });
    const collectionOverride: JsonOverride = {
      url: new RegExp(
        `/api/data/${testCase.resource}\\?(?=.*operation=collection)`,
      ),
      method: "GET",
      body: ({ callIndex }) => ({
        rows: [callIndex === 0 ? testCase.firstRow : testCase.secondRow],
        total: 401,
        facets: {},
        page: callIndex === 0 ? 1 : 2,
        pageSize: 200,
      }),
    };
    const memberOverride: JsonOverride = {
      url: new RegExp(
        `/api/data/${testCase.resource}\\?(?=.*operation=member)`,
      ),
      method: "GET",
      body: { row: testCase.firstRow },
    };
    await applyBackendMocks(page, {
      overrides: [
        memberOverride,
        collectionOverride,
        ...permissiveBackendOverrides,
      ],
    });
    const collectionPage = new ResourceCollectionPage(
      page,
      testCase.route,
      testCase.resource,
      testCase.id,
      testCase.detailText,
    );

    await collectionPage.goto(testCase.keyword);
    await expect.poll(() => collectionRequests).toContain(2);
    await collectionPage.selectRow();
    await collectionPage.goToPage(2);
    await collectionPage.expectSelectionPreserved();
    await collectionPage.goToPage(1);
    await collectionPage.expectSelectedRowChecked();
  });
}
