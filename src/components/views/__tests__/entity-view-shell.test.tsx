import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushSpy = vi.fn();
const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
  usePathname: () => "/records/alpha",
  useSearchParams: () => searchParamsRef.current,
}));

import { EntityViewShell, type EntityViewTab } from "../entity-view-shell";

type TabKey = "summary" | "records" | "history";

const tabs: readonly EntityViewTab<TabKey>[] = [
  { key: "summary", label: "Summary" },
  { key: "records", label: "Records" },
  {
    key: "history",
    label: "History",
    enabled: false,
    disabledReason: "History has not been indexed.",
  },
];

function renderShell(
  layout: "scroll" | "fill" = "scroll",
  activeTab: TabKey = "summary",
) {
  return render(
    <EntityViewShell
      viewLabel="Record View"
      title="Alpha record"
      tabs={tabs}
      activeTab={activeTab}
      defaultTab="summary"
      breadcrumbs={
        <div>
          Collection / <h1>Alpha record</h1>
        </div>
      }
      headerContent={<p>Reference entity</p>}
      metadataSummary={
        <dl>
          <dt>Status</dt>
          <dd>Reviewed</dd>
        </dl>
      }
      metadataActions={<button type="button">Export</button>}
      layout={layout}
    >
      <div>Active content</div>
    </EntityViewShell>,
  );
}

beforeEach(() => {
  pushSpy.mockClear();
  searchParamsRef.current = new URLSearchParams();
});

it("renders title, breadcrumbs, header content, metadata, actions, and content", () => {
  renderShell();

  expect(
    screen.getByRole("heading", { level: 1, name: "Alpha record" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Collection \/$/)).toBeInTheDocument();
  expect(screen.getByText("Reference entity")).toBeInTheDocument();
  expect(screen.getByText("Reviewed")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  expect(screen.getByText("Active content")).toBeInTheDocument();
});

it("uses canonical tab URLs and preserves unrelated parameters", async () => {
  const user = userEvent.setup();
  searchParamsRef.current = new URLSearchParams("filter=open&page=2");
  const { unmount } = renderShell();
  const desktopNav = screen.getByRole("navigation", { name: "Entity views" });

  await user.click(within(desktopNav).getByRole("button", { name: "Records" }));
  expect(pushSpy).toHaveBeenCalledWith(
    "/records/alpha?filter=open&page=2&tab=records",
  );

  unmount();
  searchParamsRef.current = new URLSearchParams(
    "filter=open&tab=records&page=2",
  );
  renderShell("scroll", "records");
  const nextDesktopNav = screen.getByRole("navigation", {
    name: "Entity views",
  });
  await user.click(
    within(nextDesktopNav).getByRole("button", { name: "Summary" }),
  );
  expect(pushSpy).toHaveBeenLastCalledWith("/records/alpha?filter=open&page=2");
});

it("exposes disabled reasons and prevents disabled navigation", async () => {
  const user = userEvent.setup();
  renderShell();
  const desktopNav = screen.getByRole("navigation", { name: "Entity views" });
  const disabledTab = within(desktopNav).getByRole("button", {
    name: "History",
  });

  expect(disabledTab).toHaveAttribute("aria-disabled", "true");
  expect(disabledTab).toHaveAttribute("title", "History has not been indexed.");
  await user.click(disabledTab);
  expect(pushSpy).not.toHaveBeenCalled();
});

it("provides desktop and mobile navigation with current-tab state", () => {
  renderShell("scroll", "records");

  const desktopNav = screen.getByRole("navigation", { name: "Entity views" });
  expect(
    within(desktopNav).getByRole("button", { name: "Records" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.getByRole("button", { name: "Views: Records" }),
  ).toBeInTheDocument();
});

it("supports scrolling and bounded fill content regions", () => {
  const { rerender } = renderShell();
  expect(screen.getByTestId("entity-view-scroll-region")).toHaveClass(
    "overflow-y-auto",
  );
  expect(
    screen.getByRole("region", { name: "Record View content" }),
  ).toHaveAttribute("tabindex", "0");

  rerender(
    <EntityViewShell
      viewLabel="Record View"
      title="Alpha"
      tabs={tabs}
      activeTab="records"
      defaultTab="summary"
      layout="fill"
    >
      <div>Table</div>
    </EntityViewShell>,
  );
  expect(screen.getByTestId("entity-view-fill-region")).toHaveClass(
    "min-h-0",
    "overflow-hidden",
  );
  expect(
    screen.queryByTestId("entity-view-scroll-region"),
  ).not.toBeInTheDocument();
});
