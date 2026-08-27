import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/genome",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams({ keyword: "E. coli" }),
}));

vi.mock("@/lib/auth/provider", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock("../mobile-navbar", () => ({ default: () => null }));
vi.mock("../theme-switcher-navbar", () => ({
  NavbarThemeSwitcher: () => null,
}));
vi.mock("../workspace-dropdown-content", () => ({
  WorkspaceDropdownContent: () => null,
}));
vi.mock("@/components/auth/su-banner", () => ({ SuBanner: () => null }));
vi.mock("@/components/jobs/job-status-pill", () => ({
  JobStatusPill: () => null,
}));

import Navbar from "../navbar";

describe("Navbar", () => {
  it("preserves the canonical Genome search in its search bar", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Navbar />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("textbox")).toHaveValue("E. coli");
    expect(
      screen.getByRole("combobox", { name: /search type/i }),
    ).toHaveTextContent("Genomes");

    const form = screen.getByRole("textbox").closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(mockPush).toHaveBeenCalledWith("/genome?keyword=E.%20coli");
  });
});
