import { render, screen } from "@testing-library/react";

const pushSpy = vi.fn();
const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
  usePathname: () => "/taxonomy/234",
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock("@tanstack/react-hotkeys", () => ({ useHotkey: vi.fn() }));

import { LandingShellClient } from "../landing-shell-client";

const navItems = [
  { key: "overview", label: "Overview", icon: null },
  { key: "genomes", label: "Genomes", icon: null },
] as const;

beforeEach(() => {
  pushSpy.mockClear();
  searchParamsRef.current = new URLSearchParams();
});

it("pushes ?tab= when selecting a non-default view", () => {
  render(
    <LandingShellClient
      displayName="Brucella"
      activeView="overview"
      defaultView="overview"
      navItems={navItems}
    >
      <div />
    </LandingShellClient>,
  );
  screen.getByRole("button", { name: "Genomes" }).click();
  expect(pushSpy).toHaveBeenCalledWith("/taxonomy/234?tab=genomes");
});

it("omits the param when selecting the default view", () => {
  searchParamsRef.current = new URLSearchParams("tab=genomes");
  render(
    <LandingShellClient
      displayName="Brucella"
      activeView="genomes"
      defaultView="overview"
      navItems={navItems}
    >
      <div />
    </LandingShellClient>,
  );
  screen.getByRole("button", { name: "Overview" }).click();
  expect(pushSpy).toHaveBeenCalledWith("/taxonomy/234");
});
