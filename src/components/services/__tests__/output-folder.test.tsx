import { act, render, screen } from "@testing-library/react";

import OutputFolder from "@/components/services/output-folder";
import { checkWorkspaceObjectExists } from "@/lib/services/workspace/validation";

vi.mock("@/lib/services/workspace/validation", () => ({
  checkWorkspaceObjectExists: vi.fn(),
}));

const checkWorkspaceObjectExistsMock = vi.mocked(checkWorkspaceObjectExists);

beforeEach(() => {
  vi.useFakeTimers();
  checkWorkspaceObjectExistsMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function finishDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
}

describe("OutputFolder name validation", () => {
  it("keeps a previously validated name invalid while revalidating it", async () => {
    checkWorkspaceObjectExistsMock.mockResolvedValue(false);
    const onValidationChange = vi.fn();
    const { rerender } = render(
      <OutputFolder
        title={false}
        variant="name"
        value="result"
        outputFolderPath="/user/home"
        onValidationChange={onValidationChange}
      />,
    );

    await finishDebounce();
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-invalid",
      "false",
    );

    rerender(
      <OutputFolder
        title={false}
        variant="name"
        value="other"
        outputFolderPath="/user/home"
        onValidationChange={onValidationChange}
      />,
    );
    rerender(
      <OutputFolder
        title={false}
        variant="name"
        value="result"
        outputFolderPath="/user/home"
        onValidationChange={onValidationChange}
      />,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(onValidationChange).toHaveBeenLastCalledWith(false);
  });

  it("clears a stale name conflict while validating a new key", async () => {
    checkWorkspaceObjectExistsMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const { rerender } = render(
      <OutputFolder
        title={false}
        variant="name"
        value="result"
        outputFolderPath="/user/home"
      />,
    );

    await finishDebounce();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An object with this name already exists in the selected folder.",
    );

    rerender(
      <OutputFolder
        title={false}
        variant="name"
        value="result-2"
        outputFolderPath="/user/home"
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await finishDebounce();
    expect(checkWorkspaceObjectExistsMock).toHaveBeenLastCalledWith(
      "/user/home/result-2",
      expect.any(Object),
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("keeps lookup failures invalid and allows a later retry", async () => {
    checkWorkspaceObjectExistsMock
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(false);
    const onValidationChange = vi.fn();
    const { rerender } = render(
      <OutputFolder
        title={false}
        variant="name"
        value="result"
        outputFolderPath="/user/home"
        onValidationChange={onValidationChange}
      />,
    );

    await finishDebounce();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to validate this name. Please try again.",
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(onValidationChange).toHaveBeenLastCalledWith(false);

    rerender(
      <OutputFolder
        title={false}
        variant="name"
        value="result-2"
        outputFolderPath="/user/home"
        onValidationChange={onValidationChange}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await finishDebounce();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(onValidationChange).toHaveBeenLastCalledWith(true);
  });
});
