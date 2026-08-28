import { render, screen } from "@testing-library/react";

const { notFoundSpy } = vi.hoisted(() => ({
  notFoundSpy: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// The singular render path mounts OrganismLandingShell → LandingShellClient, which uses
// these navigation hooks; mock them as the taxonomy page test does.
vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/genome/59201.7581",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// LandingShellClient also calls useHotkey; stub it so the render path doesn't throw.
vi.mock("@tanstack/react-hotkeys", () => ({ useHotkey: vi.fn() }));

import GenomePage from "../genome/[genomeId]/page";
import StrainListPage from "../strain/page";

vi.mock("@/lib/genome-view/server", () => ({
  getGenome: vi.fn((genomeId: string) =>
    Promise.resolve({
      genome_id: genomeId,
      genome_name: "Test genome",
      superkingdom: "Bacteria",
    }),
  ),
}));

beforeEach(() => {
  notFoundSpy.mockClear();
});

it("genome singular renders for a dotted id", async () => {
  render(
    await GenomePage({
      params: Promise.resolve({ genomeId: "59201.7581" }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(
    screen.getByRole("heading", { name: "Test genome" }),
  ).toBeInTheDocument();
});

it("strain list renders (list-only type)", async () => {
  render(
    await StrainListPage({
      searchParams: Promise.resolve({ keyword: "H1N1" }),
    }),
  );
  expect(screen.getByText("keyword(H1N1)")).toBeInTheDocument();
});

it("genome singular calls notFound for an empty id", async () => {
  await expect(
    GenomePage({
      params: Promise.resolve({ genomeId: "" }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
  expect(notFoundSpy).toHaveBeenCalled();
});
