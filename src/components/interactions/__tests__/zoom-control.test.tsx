import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ZoomControl, ratioToZoomPercent } from "../sigma/zoom-control";

const zoomIn = vi.fn();
const zoomOut = vi.fn();
const goto = vi.fn();
let onUpdated: (() => void) | undefined;
const camera = {
  ratio: 2,
  getBoundedRatio: vi.fn((ratio: number) => ratio),
  on: vi.fn((_event: string, callback: () => void) => { onUpdated = callback; }),
  off: vi.fn(),
};

vi.mock("@react-sigma/core", () => ({
  useCamera: () => ({ goto, zoomIn, zoomOut }),
  useSigma: () => ({ getCamera: () => camera }),
}));

beforeEach(() => {
  camera.ratio = 2;
  camera.getBoundedRatio.mockImplementation((ratio) => ratio);
  onUpdated = undefined;
});

describe("ZoomControl", () => {
  it("converts Sigma camera ratio to a user-facing percentage", () => {
    expect(ratioToZoomPercent(2)).toBe(50);
    expect(ratioToZoomPercent(0.5)).toBe(200);
  });

  it("shows the current zoom and follows camera updates", () => {
    render(<ZoomControl />);
    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    expect(input).toHaveValue(50);

    camera.ratio = 0.8;
    act(() => { onUpdated?.(); });
    expect(input).toHaveValue(125);
  });

  it("uses a symmetric layout with the complete percentage centered", () => {
    render(<ZoomControl />);
    const group = screen.getByRole("group");
    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });

    expect(group).toHaveClass("grid-cols-[2rem_1fr_2rem]");
    expect(input.parentElement).toHaveClass("justify-center", "gap-0.5");
    expect(input).toHaveClass("text-right");
    expect(input).toHaveStyle({ width: "2ch" });
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveClass("size-8");
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveClass("size-8");
  });

  it("uses Sigma camera zoom for the minus and plus buttons", async () => {
    const user = userEvent.setup();
    render(<ZoomControl />);

    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(zoomOut).toHaveBeenCalledOnce();
    expect(zoomIn).toHaveBeenCalledOnce();
  });

  it("commits a typed percentage through Sigma's bounded camera ratio", async () => {
    const user = userEvent.setup();
    camera.getBoundedRatio.mockReturnValue(0.4);
    render(<ZoomControl />);

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    await user.clear(input);
    await user.type(input, "250{Enter}");

    expect(camera.getBoundedRatio).toHaveBeenCalledWith(0.4);
    expect(goto).toHaveBeenCalledWith({ ratio: 0.4 }, { duration: 150 });
  });

  it("restores the current zoom when typed input is invalid", async () => {
    const user = userEvent.setup();
    render(<ZoomControl />);

    const input = screen.getByRole("spinbutton", { name: "Zoom percentage" });
    await user.clear(input);
    fireEvent.blur(input);

    expect(input).toHaveValue(50);
    expect(goto).not.toHaveBeenCalled();
  });
});
