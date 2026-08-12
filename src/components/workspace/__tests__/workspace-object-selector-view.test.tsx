import { createRef, type RefObject } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WorkspaceObjectSelectorView } from "../workspace-object-selector-view";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

function renderView(objects: WorkspaceObject[]) {
  const onObjectClick = vi.fn();
  const itemRefs = { current: [] } as RefObject<
    (HTMLButtonElement | null)[]
  >;
  const consoleError = vi.mocked(console.error);
  consoleError.mockClear();

  render(
    <WorkspaceObjectSelectorView
      placeholder="Search workspace objects"
      validationError={null}
      inputValue=""
      searchQuery=""
      objects={objects}
      loading={false}
      error={null}
      showDropdown
      isDialogOpen={false}
      highlightedIndex={-1}
      dropdownLayout={{
        openUpward: false,
        maxHeight: 640,
        rect: { top: 20, left: 20, width: 400 },
      }}
      inputRef={createRef<HTMLDivElement>()}
      inputElementRef={createRef<HTMLInputElement>()}
      dropdownRef={createRef<HTMLDivElement>()}
      itemRefs={itemRefs}
      onInputChange={vi.fn()}
      onInputFocus={vi.fn()}
      onInputKeyDown={vi.fn()}
      onToggleDropdown={vi.fn()}
      onDialogOpenChange={vi.fn()}
      onObjectClick={onObjectClick}
      onObjectHighlight={vi.fn()}
    />,
  );

  return { consoleError, onObjectClick };
}

describe("WorkspaceObjectSelectorView", () => {
  it("renders and selects distinct paths that share a backend id without key errors", () => {
    const objects = [
      {
        id: "shared-id",
        name: "first.fq",
        path: "/alice@bvbrc/home/first.fq",
        type: "reads",
        isDirectory: false,
      },
      {
        id: "shared-id",
        name: "second.fq",
        path: "/alice@bvbrc/home/second.fq",
        type: "reads",
        isDirectory: false,
      },
    ] satisfies WorkspaceObject[];
    const { consoleError, onObjectClick } = renderView(objects);

    expect(screen.getByRole("button", { name: /first\.fq/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /second\.fq/i })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /second\.fq/i }));
    expect(onObjectClick).toHaveBeenCalledWith(objects[1]);
    expect(
      consoleError.mock.calls.some((args) =>
        args.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Encountered two children with the same key"),
        ),
      ),
    ).toBe(false);
  });
});
