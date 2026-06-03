# Brucella Taxonomy Overview Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `/taxonomy/234` Overview page for Brucella using the existing `OrganismLandingShell` pattern, and update the Brucella card in the bacteria featured genera grid to link there internally.

**Architecture:** Dynamic route `src/app/(views)/taxonomy/[taxonId]/` with a hardcoded Brucella config (taxon 234). The page renders `OrganismLandingShell` with the same vertical nav and `DataSummary` + `MetadataDistributions` on the Overview tab. All other tabs are placeholder stubs.

**Tech Stack:** Next.js 16 App Router, React Server Components, shadcn/ui, `@/components/organisms/*` building blocks.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/app/(views)/taxonomy/layout.tsx` | Navbar + Footer wrapper |
| Create | `src/app/(views)/taxonomy/[taxonId]/_config.ts` | Hardcoded Brucella config |
| Create | `src/app/(views)/taxonomy/[taxonId]/_components/nav-items.tsx` | 16 nav tabs (Overview live, rest placeholder) |
| Create | `src/app/(views)/taxonomy/[taxonId]/views/overview.tsx` | DataSummary + MetadataDistributions |
| Create | `src/app/(views)/taxonomy/[taxonId]/page.tsx` | Route entry, reads params, renders shell |
| Create | `src/app/(views)/taxonomy/[taxonId]/__tests__/page.test.tsx` | Unit tests for page routing |
| Modify | `src/components/organisms/genera-grid/featured-genera-data.ts` | Brucella href → internal |

---

## Task 1: Layout

**Files:**
- Create: `src/app/(views)/taxonomy/layout.tsx`

- [ ] **Step 1: Create layout**

```tsx
import Footer from "@/components/footers/footer";
import Navbar from "@/components/navbars/navbar";

export default function TaxonomyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="bg-muted/30 flex grow py-4">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify file exists**

```bash
ls src/app/\(views\)/taxonomy/layout.tsx
```

Expected: file path printed, no error.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(views\)/taxonomy/layout.tsx
git commit -m "feat: add taxonomy route group layout"
```

---

## Task 2: Config

**Files:**
- Create: `src/app/(views)/taxonomy/[taxonId]/_config.ts`

- [ ] **Step 1: Create config**

```ts
import type { OrganismLandingConfig } from "@/components/organisms/types";

export const brucellaTaxonomyConfig: OrganismLandingConfig = {
  displayName: "Brucella",
  taxonId: 234,
  accent: "bacteria",
  defaultView: "overview",
  metadataFields: ["host_name", "isolation_country", "isolation_source"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(views\)/taxonomy/\[taxonId\]/_config.ts
git commit -m "feat: add hardcoded Brucella taxonomy config"
```

---

## Task 3: Overview View

**Files:**
- Create: `src/app/(views)/taxonomy/[taxonId]/views/overview.tsx`

- [ ] **Step 1: Create overview view**

```tsx
import { Suspense } from "react";

import { DataSummary } from "@/components/organisms/data-summary/data-summary";
import { DataSummarySkeleton } from "@/components/organisms/data-summary/data-summary-skeleton";
import { MetadataDistributions } from "@/components/organisms/metadata-distributions/metadata-distributions";
import { MetadataDistributionsSkeleton } from "@/components/organisms/metadata-distributions/metadata-distributions-skeleton";
import { withSectionError } from "@/components/organisms/shared/with-section-error";

import { brucellaTaxonomyConfig as config } from "../_config";

async function DataSummaryBoundary() {
  return withSectionError(() => DataSummary({ taxonId: config.taxonId }));
}

async function MetadataDistributionsBoundary() {
  return withSectionError(() =>
    MetadataDistributions({
      taxonId: config.taxonId,
      fields: config.metadataFields,
    }),
  );
}

export function OverviewView() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<DataSummarySkeleton />}>
        <DataSummaryBoundary />
      </Suspense>

      <Suspense fallback={<MetadataDistributionsSkeleton />}>
        <MetadataDistributionsBoundary />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(views\)/taxonomy/\[taxonId\]/views/overview.tsx
git commit -m "feat: add Brucella taxonomy overview view"
```

---

## Task 4: Nav Items

**Files:**
- Create: `src/app/(views)/taxonomy/[taxonId]/_components/nav-items.tsx`

- [ ] **Step 1: Create nav items**

```tsx
import {
  Activity,
  Atom,
  Binary,
  Blocks,
  Database,
  Dna,
  FlaskConical,
  Handshake,
  Layers,
  ListTree,
  Microscope,
  Network,
  Puzzle,
  Route,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import { makePlaceholderView as placeholderView } from "@/components/organisms/shared/make-placeholder-view";
import type { OrganismLandingView } from "@/components/organisms/types";

import { OverviewView } from "../views/overview";

export const taxonomyNavItems: OrganismLandingView[] = [
  {
    key: "overview",
    label: "Overview",
    icon: <Blocks />,
    Component: OverviewView,
  },
  {
    key: "phylogeny",
    label: "Phylogeny",
    icon: <Network />,
    Component: placeholderView(
      "Phylogeny",
      "Phylogeny data and visualization are planned for a follow-up view.",
    ),
  },
  {
    key: "taxonomy",
    label: "Taxonomy",
    icon: <Binary />,
    Component: placeholderView(
      "Taxonomy",
      "Taxonomy browsing is stubbed while the overview data panels are brought online.",
    ),
  },
  {
    key: "genomes",
    label: "Genomes",
    icon: <Dna />,
    Component: placeholderView(
      "Genomes",
      "Genome table filtering and pagination are planned for a dedicated follow-up view.",
    ),
  },
  {
    key: "amr-phenotypes",
    label: "AMR Phenotypes",
    icon: <ShieldCheck />,
    Component: placeholderView("AMR Phenotypes"),
  },
  {
    key: "sequences",
    label: "Sequences",
    icon: <Database />,
    Component: placeholderView("Sequences"),
  },
  {
    key: "features",
    label: "Features",
    icon: <ListTree />,
    Component: placeholderView("Features"),
  },
  {
    key: "proteins",
    label: "Proteins",
    icon: <Atom />,
    Component: placeholderView("Proteins"),
  },
  {
    key: "protein-structures",
    label: "Protein Structures",
    icon: <Waypoints />,
    Component: placeholderView("Protein Structures"),
  },
  {
    key: "specialty-genes",
    label: "Specialty Genes",
    icon: <Microscope />,
    Component: placeholderView("Specialty Genes"),
  },
  {
    key: "domains-and-motifs",
    label: "Domains and Motifs",
    icon: <Puzzle />,
    Component: placeholderView("Domains and Motifs"),
  },
  {
    key: "epitopes",
    label: "Epitopes",
    icon: <Activity />,
    Component: placeholderView("Epitopes"),
  },
  {
    key: "pathways",
    label: "Pathways",
    icon: <Route />,
    Component: placeholderView("Pathways"),
  },
  {
    key: "subsystems",
    label: "Subsystems",
    icon: <Layers />,
    Component: placeholderView("Subsystems"),
  },
  {
    key: "experiments",
    label: "Experiments",
    icon: <FlaskConical />,
    Component: placeholderView("Experiments"),
  },
  {
    key: "interactions",
    label: "Interactions",
    icon: <Handshake />,
    Component: placeholderView("Interactions"),
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(views\)/taxonomy/\[taxonId\]/_components/nav-items.tsx
git commit -m "feat: add taxonomy nav items (overview live, rest placeholder)"
```

---

## Task 5: Page

**Files:**
- Create: `src/app/(views)/taxonomy/[taxonId]/page.tsx`

- [ ] **Step 1: Create page**

```tsx
import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { taxonomyNavItems } from "./_components/nav-items";
import { brucellaTaxonomyConfig } from "./_config";

export const dynamic = "force-dynamic";

interface TaxonomyPageProps {
  searchParams?: Promise<{
    view?: string | string[];
  }>;
}

export default async function TaxonomyPage({ searchParams }: TaxonomyPageProps) {
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams?.view;
  const activeViewKey = Array.isArray(viewParam) ? viewParam[0] : viewParam;

  return (
    <OrganismLandingShell
      config={brucellaTaxonomyConfig}
      views={taxonomyNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(views\)/taxonomy/\[taxonId\]/page.tsx
git commit -m "feat: add taxonomy page route"
```

---

## Task 6: Tests

**Files:**
- Create: `src/app/(views)/taxonomy/[taxonId]/__tests__/page.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
import { render, screen } from "@testing-library/react";

import TaxonomyPage from "../page";

describe("TaxonomyPage", () => {
  it("renders the heading for Brucella", async () => {
    const node = await TaxonomyPage({
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByRole("heading", { level: 1, name: "Brucella" }),
    ).toBeInTheDocument();
  });

  it("renders the taxonomy stub view when view=taxonomy", async () => {
    const node = await TaxonomyPage({
      searchParams: Promise.resolve({ view: "taxonomy" }),
    });

    render(node);

    expect(
      screen.getByText(/Taxonomy browsing is stubbed/),
    ).toBeInTheDocument();
  });

  it("renders placeholder stub for amr-phenotypes view", async () => {
    const node = await TaxonomyPage({
      searchParams: Promise.resolve({ view: "amr-phenotypes" }),
    });

    render(node);

    expect(screen.getAllByText("AMR Phenotypes")).toHaveLength(2);
    expect(
      screen.getByText(/This view is coming soon/),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they pass**

```bash
pnpm test src/app/\(views\)/taxonomy
```

Expected: 3 tests pass, 0 fail.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(views\)/taxonomy/\[taxonId\]/__tests__/page.test.tsx
git commit -m "test: add TaxonomyPage unit tests"
```

---

## Task 7: Update Brucella Link

**Files:**
- Modify: `src/components/organisms/genera-grid/featured-genera-data.ts`

- [ ] **Step 1: Update Brucella's href**

In `featured-genera-data.ts`, find the Brucella entry and change its `href`:

```ts
  {
    name: "Brucella",
    href: "/taxonomy/234",
  },
```

The entry previously read `href: "https://www.bv-brc.org/view/Taxonomy/234#view_tab=overview"`.

- [ ] **Step 2: Run the full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Run lint and typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/organisms/genera-grid/featured-genera-data.ts
git commit -m "feat: link Brucella featured genus card to internal taxonomy page"
```

---

## Task 8: Manual Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Navigate to the Brucella page**

Open `http://localhost:3019/taxonomy/234`. Verify:
- Page loads without error
- Heading reads "Brucella"
- Vertical nav sidebar is present with all 16 tabs
- Overview tab is active by default
- Data summary KPI cards appear (or loading skeleton, then cards)
- Metadata distribution donuts appear (or loading skeleton, then donuts)

- [ ] **Step 3: Test nav tab switching**

Click "Taxonomy" in the sidebar. Verify URL changes to `?view=taxonomy` and placeholder text "Taxonomy browsing is stubbed" appears.

- [ ] **Step 4: Test the link from the bacteria overview page**

Navigate to `http://localhost:3019/organisms/bacteria`. Find the Brucella card in the Featured Genera grid. Click it. Verify you are redirected to `http://localhost:3019/taxonomy/234` (not to bv-brc.org).
