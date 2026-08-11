import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

it("removes the legacy view parameter while preserving unrelated parameters", async () => {
  searchParamsRef.current = new URLSearchParams("view=overview&open=235&utm_source=test");
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

  await userEvent.click(screen.getByRole("button", { name: "Genomes" }));
  expect(pushSpy).toHaveBeenCalledWith(
    "/taxonomy/234?open=235&utm_source=test&tab=genomes",
  );
});

it("does not navigate to a disabled item", async () => {
  render(
    <LandingShellClient
      displayName="Brucella"
      activeView="overview"
      defaultView="overview"
      navItems={[...navItems, { key: "phylogeny", label: "Phylogeny", icon: null, enabled: false }]}
    >
      <div />
    </LandingShellClient>,
  );

  await userEvent.click(screen.getByRole("button", { name: "Phylogeny" }));
  expect(pushSpy).not.toHaveBeenCalled();
});

it("uses a viewport-bounded wrapper only for fill views", () => {
  const { container, rerender } = render(
    <LandingShellClient
      displayName="Brucella"
      activeView="genomes"
      defaultView="overview"
      navItems={navItems}
      layout="fill"
    >
      <div />
    </LandingShellClient>,
  );

  expect(container.querySelector(".h-\\[calc\\(100dvh-5\\.5rem\\)\\]")).not.toBeNull();

  rerender(
    <LandingShellClient
      displayName="Brucella"
      activeView="overview"
      defaultView="overview"
      navItems={navItems}
      layout="scroll"
    >
      <div />
    </LandingShellClient>,
  );
  expect(container.querySelector(".h-\\[calc\\(100dvh-5\\.5rem\\)\\]")).toBeNull();
  expect(container.querySelector(".overflow-y-auto")).not.toBeNull();
});
