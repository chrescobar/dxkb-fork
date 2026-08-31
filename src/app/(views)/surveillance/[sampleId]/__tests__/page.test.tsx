import { render, screen } from "@testing-library/react";
import { DataApiError } from "@/lib/data-api/repository";

const mocks = vi.hoisted(() => ({ getSurveillance: vi.fn() }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  },
  usePathname: () => "/surveillance/sample-1",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/surveillance-view/server", () => ({
  getSurveillance: mocks.getSurveillance,
}));

import SurveillancePage, { generateMetadata } from "../page";

const record = {
  id: "backend-1",
  sample_identifier: "sample/1",
  pathogen_test_type: ["RAT/antigen"],
  collection_date: "2024-03",
  collection_latitude: "41.5",
  collection_longitude: -87.25,
  pathogen_test_result: ["positive", "confirmed"],
};

function props(
  sampleId = "sample%2F1",
  query: Record<string, string | string[] | undefined> = {},
) {
  return {
    params: Promise.resolve({ sampleId }),
    searchParams: Promise.resolve(query),
  };
}

describe("Surveillance member page", () => {
  beforeEach(() => {
    mocks.getSurveillance.mockReset();
    mocks.getSurveillance.mockResolvedValue({ status: "unique", record });
  });

  it("decodes the sample ID, passes a scalar test type, and renders grouped data", async () => {
    render(
      await SurveillancePage(
        props("sample%2F1", { pathogen_test_type: "RAT/antigen" }),
      ),
    );

    expect(mocks.getSurveillance).toHaveBeenCalledWith(
      "sample/1",
      "RAT/antigen",
    );
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("2024-03")).toBeInTheDocument();
    expect(screen.getByText("41.5° N, 87.25° W")).toBeInTheDocument();
    expect(screen.getAllByText("positive, confirmed")).toHaveLength(2);
    expect(screen.getByText("Vaccination")).toBeInTheDocument();
    expect(screen.getAllByText("No data available.").length).toBeGreaterThan(0);
    await expect(generateMetadata(props())).resolves.toMatchObject({
      title: "sample/1 | Surveillance",
    });
  });

  it("renders accessible canonical choices for an ambiguous sample", async () => {
    mocks.getSurveillance.mockResolvedValue({
      status: "ambiguous",
      testTypes: ["PCR", "RAT/antigen"],
    });
    render(await SurveillancePage(props()));

    expect(
      screen.getByRole("heading", { name: "Choose a pathogen test" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PCR" })).toHaveAttribute(
      "href",
      "/surveillance/sample%2F1?pathogen_test_type=PCR",
    );
    expect(screen.getByRole("link", { name: "RAT/antigen" })).toHaveAttribute(
      "href",
      "/surveillance/sample%2F1?pathogen_test_type=RAT%2Fantigen",
    );
  });

  it("canonicalizes repeated discriminator and tab parameters", async () => {
    await expect(
      SurveillancePage(
        props("sample%2F1", {
          pathogen_test_type: ["PCR", "RAT"],
          tab: "overview",
          source: "legacy",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/surveillance/sample%2F1?source=legacy",
    );
    expect(mocks.getSurveillance).toHaveBeenCalledWith("sample/1", undefined);
  });

  it("uses notFound for malformed, absent, and inaccessible records", async () => {
    await expect(SurveillancePage(props("%E0%A4%A"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    mocks.getSurveillance.mockResolvedValueOnce({ status: "not-found" });
    await expect(SurveillancePage(props())).rejects.toThrow("NEXT_NOT_FOUND");
    mocks.getSurveillance.mockRejectedValueOnce(
      new DataApiError("Forbidden", 403),
    );
    await expect(SurveillancePage(props())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("preserves upstream errors", async () => {
    mocks.getSurveillance.mockRejectedValueOnce(
      new DataApiError("Surveillance backend unavailable", 503),
    );
    await expect(SurveillancePage(props())).rejects.toThrow(
      "Surveillance backend unavailable",
    );
  });
});
