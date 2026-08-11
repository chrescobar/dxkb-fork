import type { OrganismLandingView } from "@/components/organisms/types";

import { resolveLandingTab } from "../landing-request";

const Component = () => null;
const enabledRequests: [
  Parameters<typeof resolveLandingTab>[0],
  "genomes" | "features",
][] = [
  [{ tab: "genomes" }, "genomes"],
  [{ view: "features" }, "features"],
  [{ tab: ["features", "genomes"] }, "features"],
  [{ view: ["genomes", "features"] }, "genomes"],
];

const views = [
  { key: "overview", label: "Overview", icon: null, Component },
  { key: "genomes", label: "Genomes", icon: null, Component },
  { key: "features", label: "Features", icon: null, Component },
  {
    key: "phylogeny",
    label: "Phylogeny",
    icon: null,
    Component,
    enabled: false,
  },
] satisfies OrganismLandingView[];

describe("resolveLandingTab", () => {
  it.each([undefined, {}, { tab: "" }, { tab: [] }])(
    "uses the default view when no tab is requested: %j",
    (params) => {
      expect(resolveLandingTab(params, views)).toEqual({ redirectToOverview: false });
    },
  );

  it.each(enabledRequests)("accepts an enabled request: %j", (params, activeViewKey) => {
    expect(resolveLandingTab(params, views)).toEqual({
      activeViewKey,
      redirectToOverview: false,
    });
  });

  it("gives the canonical tab parameter precedence over the legacy view parameter", () => {
    expect(resolveLandingTab({ tab: "genomes", view: "features" }, views)).toEqual({
      activeViewKey: "genomes",
      redirectToOverview: false,
    });
  });

  it("falls back to the legacy view when tab is empty", () => {
    expect(resolveLandingTab({ tab: "", view: "features" }, views)).toEqual({
      activeViewKey: "features",
      redirectToOverview: false,
    });
  });

  it.each([{ tab: "missing" }, { tab: "phylogeny" }, { view: "phylogeny" }])(
    "redirects unknown and disabled requests: %j",
    (params) => {
      expect(resolveLandingTab(params, views)).toEqual({ redirectToOverview: true });
    },
  );
});
