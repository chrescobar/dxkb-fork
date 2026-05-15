import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useStore } from "@tanstack/react-form";
import { http, HttpResponse } from "msw";

import { OutputLocationFields } from "@/components/services/output-location-fields";
import { server } from "@/test-helpers/msw-server";

vi.mock("@/components/workspace/workspace-object-selector", () => ({
  WorkspaceObjectSelector: ({
    value,
    onObjectSelect,
    placeholder,
  }: {
    value?: string;
    onObjectSelect?: (obj: { path: string }) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      data-testid="folder-selector"
      aria-label={placeholder ?? "folder selector"}
      onClick={() => onObjectSelect?.({ path: "/user/home" })}
    >
      {value || placeholder}
    </button>
  ),
}));

function TestForm() {
  const form = useForm({
    defaultValues: { output_path: "", output_file: "" },
    onSubmit: vi.fn(),
  });

  const canSubmit = useStore(form.store, (s) => s.canSubmit);

  return (
    <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(); }}>
      <OutputLocationFields form={form} />
      <button type="submit" disabled={!canSubmit}>
        Submit
      </button>
    </form>
  );
}

describe("OutputLocationFields", () => {
  it("renders the output folder selector and name input", () => {
    render(<TestForm />);

    expect(screen.getByTestId("folder-selector")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select Output Name...")).toBeInTheDocument();
  });

  it("renders folder label and name label", () => {
    render(<TestForm />);
    expect(screen.getByText("Output Folder")).toBeInTheDocument();
    expect(screen.getByText("Output Name")).toBeInTheDocument();
  });

  it("shows a taken-name error after async validation resolves with taken", async () => {
    server.use(
      http.post("/api/services/workspace", () => HttpResponse.json({})),
    );

    render(<TestForm />);

    const nameInput = screen.getByPlaceholderText("Select Output Name...");
    await act(async () => {
      await userEvent.type(nameInput, "taken-name");
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId("folder-selector"));
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(
            "An object with this name already exists in the selected folder.",
          ),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("shows no error when workspace object does not exist", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    render(<TestForm />);

    const nameInput = screen.getByPlaceholderText("Select Output Name...");
    await act(async () => {
      await userEvent.type(nameInput, "available-name");
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId("folder-selector"));
    });

    await waitFor(
      () => {
        expect(
          screen.queryByText(
            "An object with this name already exists in the selected folder.",
          ),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
