import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import OrganismsError from "../error";

describe("OrganismsError", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    consoleError.mockClear();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it("explains the taxonomy failure, logs it, and retries through reset", async () => {
    const error = Object.assign(new Error("taxonomy unavailable"), { digest: "digest-1" });
    const reset = vi.fn();

    render(<OrganismsError error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Organism data is temporarily unavailable" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/could not load the taxonomy data/i)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(error);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs only when the error object changes", () => {
    const first = new Error("first");
    const second = new Error("second");
    const { rerender } = render(<OrganismsError error={first} reset={vi.fn()} />);

    rerender(<OrganismsError error={first} reset={vi.fn()} />);
    expect(consoleError).toHaveBeenCalledTimes(1);

    rerender(<OrganismsError error={second} reset={vi.fn()} />);
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenLastCalledWith(second);
  });
});
