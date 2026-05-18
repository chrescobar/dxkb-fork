import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import React from "react";

import { PrimerDesignInputSequenceCard } from "@/app/services/(genomics)/primer-design/primer-design-input-sequence-card";
import PrimerDesignServicePage from "@/app/services/(genomics)/primer-design/page";
import { ServiceDebuggingProvider } from "@/contexts/service-debugging-context";
import { AuthBoundary } from "@/lib/auth/provider";
import { memoryAuthAdapter } from "@/lib/auth/adapters/memory";
import { markerLabels } from "@/lib/forms/(genomics)/primer-design/primer-design-form-utils";
import { server } from "@/test-helpers/msw-server";

vi.mock("@/components/workspace/workspace-object-selector", () => ({
  WorkspaceObjectSelector: ({
    value,
    onObjectSelect,
    onSelectedObjectChange,
    placeholder,
  }: {
    value?: string;
    onObjectSelect?: (obj: { path: string }) => void;
    onSelectedObjectChange?: (obj: { path: string } | null) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      data-testid="workspace-selector"
      onClick={() => {
        const obj = { path: "/user/test-path" };
        onObjectSelect?.(obj);
        onSelectedObjectChange?.(obj);
      }}
    >
      {value || placeholder}
    </button>
  ),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// ── Card-level: PrimerDesignInputSequenceCard ─────────────────────────────────

function CardWrapper({
  inputType = "sequence_text" as const,
  sequenceValidation = null as { isValid: boolean; message: string } | null,
  onInputTypeChange = vi.fn(),
  onSequenceValueChange = vi.fn(),
  onUpdateSequenceWithMarkers = vi.fn(),
  onWorkspaceSelection = vi.fn(),
}: {
  inputType?: "sequence_text" | "workplace_fasta" | "database_id";
  sequenceValidation?: { isValid: boolean; message: string } | null;
  onInputTypeChange?: (
    next: "sequence_text" | "workplace_fasta" | "database_id",
    prev: "sequence_text" | "workplace_fasta" | "database_id",
  ) => void;
  onSequenceValueChange?: (value: string) => void;
  onUpdateSequenceWithMarkers?: (marker: keyof typeof markerLabels) => void;
  onWorkspaceSelection?: (obj: { path: string }) => void;
}) {
  const form = useForm({
    defaultValues: {
      input_type: inputType,
      sequence_input: "",
      SEQUENCE_ID: "",
    },
  });
  const isRestoringValueRef = React.useRef(false);
  return (
    <QueryClientProvider client={makeQueryClient()}>
      <PrimerDesignInputSequenceCard
        form={form as never}
        inputType={inputType}
        sequenceValidation={sequenceValidation}
        showAdvanced={false}
        isRestoringValueRef={isRestoringValueRef as never}
        onShowAdvancedChange={vi.fn()}
        onInputTypeChange={onInputTypeChange as never}
        onSequenceValueChange={onSequenceValueChange}
        onSequenceSelect={vi.fn()}
        onUpdateSequenceWithMarkers={onUpdateSequenceWithMarkers as never}
        onWorkspaceSelection={onWorkspaceSelection as never}
      />
    </QueryClientProvider>
  );
}

describe("PrimerDesignInputSequenceCard — card level", () => {
  it("renders Paste Sequence and Workspace FASTA tab triggers", () => {
    render(<CardWrapper />);

    expect(
      screen.getByRole("tab", { name: /paste sequence/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /workspace fasta/i }),
    ).toBeInTheDocument();
  });

  it("shows sequence textarea and marker buttons when inputType is sequence_text", () => {
    render(<CardWrapper inputType="sequence_text" />);

    expect(
      screen.getByPlaceholderText(/enter nucleotide sequence/i),
    ).toBeInTheDocument();

    const firstMarkerLabel = Object.values(markerLabels)[0];
    expect(screen.getByText(firstMarkerLabel)).toBeInTheDocument();
  });

  it("hides marker buttons and textarea when inputType is workplace_fasta", () => {
    render(<CardWrapper inputType="workplace_fasta" />);

    expect(
      screen.queryByPlaceholderText(/enter nucleotide sequence/i),
    ).not.toBeInTheDocument();

    const firstMarkerLabel = Object.values(markerLabels)[0];
    expect(screen.queryByText(firstMarkerLabel)).not.toBeInTheDocument();

    expect(screen.getByTestId("workspace-selector")).toBeInTheDocument();
  });

  it("calls onInputTypeChange when a tab is clicked", async () => {
    const user = userEvent.setup();
    const onInputTypeChange = vi.fn();
    render(
      <CardWrapper
        inputType="sequence_text"
        onInputTypeChange={onInputTypeChange}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /workspace fasta/i }));

    expect(onInputTypeChange).toHaveBeenCalledWith(
      "workplace_fasta",
      "sequence_text",
    );
  });

  it("calls onSequenceValueChange when textarea content changes", async () => {
    const user = userEvent.setup();
    const onSequenceValueChange = vi.fn();
    render(
      <CardWrapper
        inputType="sequence_text"
        onSequenceValueChange={onSequenceValueChange}
      />,
    );

    const textarea = screen.getByPlaceholderText(/enter nucleotide sequence/i);
    await user.type(textarea, "A");

    expect(onSequenceValueChange).toHaveBeenCalled();
  });

  it("calls onUpdateSequenceWithMarkers when a marker button is clicked", async () => {
    const user = userEvent.setup();
    const onUpdateSequenceWithMarkers = vi.fn();
    render(
      <CardWrapper
        inputType="sequence_text"
        onUpdateSequenceWithMarkers={onUpdateSequenceWithMarkers}
      />,
    );

    const firstMarkerLabel = Object.values(markerLabels)[0];
    await user.click(screen.getByText(firstMarkerLabel));

    expect(onUpdateSequenceWithMarkers).toHaveBeenCalledWith(
      Object.keys(markerLabels)[0],
    );
  });

  it("calls onWorkspaceSelection when workspace FASTA file is selected", async () => {
    const user = userEvent.setup();
    const onWorkspaceSelection = vi.fn();
    render(
      <CardWrapper
        inputType="workplace_fasta"
        onWorkspaceSelection={onWorkspaceSelection}
      />,
    );

    await user.click(screen.getByTestId("workspace-selector"));

    expect(onWorkspaceSelection).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/user/test-path" }),
    );
  });

  it("shows valid feedback when sequenceValidation.isValid is true", () => {
    render(
      <CardWrapper
        inputType="sequence_text"
        sequenceValidation={{ isValid: true, message: "" }}
      />,
    );

    expect(screen.getByText(/sequence looks valid/i)).toBeInTheDocument();
  });

  it("shows error message when sequenceValidation.isValid is false", () => {
    render(
      <CardWrapper
        inputType="sequence_text"
        sequenceValidation={{ isValid: false, message: "Sequence is too short" }}
      />,
    );

    expect(screen.getByText("Sequence is too short")).toBeInTheDocument();
  });
});

// ── Page-level tab switching ──────────────────────────────────────────────────

function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const port = memoryAuthAdapter({
    initialSession: {
      username: "testuser",
      email: "test@example.com",
      token: "test-token",
      email_verified: true,
    },
    onRequest: (input, init) => fetch(input, init),
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBoundary
        port={port}
        initialUser={{
          username: "testuser",
          email: "test@example.com",
          token: "test-token",
          email_verified: true,
        }}
      >
        <ServiceDebuggingProvider>{children}</ServiceDebuggingProvider>
      </AuthBoundary>
    </QueryClientProvider>
  );
}

describe("PrimerDesignServicePage — tab switching", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    server.use(
      http.get("*/api/auth/profile", () =>
        HttpResponse.json({ settings: { default_job_folder: "" } }),
      ),
      http.post("*/api/services/workspace", async ({ request }) => {
        const body = (await request.json()) as { method?: string };
        if (body.method === "Workspace.get") {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json([]);
      }),
    );
  });

  it("default tab is Paste Sequence and shows sequence textarea", () => {
    render(<PrimerDesignServicePage />, { wrapper: Providers });

    // base-ui Tabs uses data-active attribute (not data-state="active")
    expect(
      screen.getByRole("tab", { name: /paste sequence/i }),
    ).toHaveAttribute("data-active");
    expect(
      screen.getByPlaceholderText(/enter nucleotide sequence/i),
    ).toBeInTheDocument();
  });

  it("switching to Workspace FASTA tab shows the FASTA file selector", async () => {
    const user = userEvent.setup();
    render(<PrimerDesignServicePage />, { wrapper: Providers });

    await user.click(screen.getByRole("tab", { name: /workspace fasta/i }));

    // Page may have multiple workspace selectors (input + output folder)
    const selectors = screen.getAllByTestId("workspace-selector");
    expect(selectors.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByPlaceholderText(/enter nucleotide sequence/i),
    ).not.toBeInTheDocument();
  });

  it("switching back to Paste Sequence restores the previously typed value", async () => {
    const user = userEvent.setup();
    render(<PrimerDesignServicePage />, { wrapper: Providers });

    const textarea = screen.getByPlaceholderText(/enter nucleotide sequence/i);
    await user.type(textarea, "ATCGATCG");

    await user.click(screen.getByRole("tab", { name: /workspace fasta/i }));
    await user.click(screen.getByRole("tab", { name: /paste sequence/i }));

    expect(
      screen.getByPlaceholderText(/enter nucleotide sequence/i),
    ).toHaveValue("ATCGATCG");
  });

  it("marker buttons are rendered in the Paste Sequence tab", () => {
    render(<PrimerDesignServicePage />, { wrapper: Providers });

    const firstMarkerLabel = Object.values(markerLabels)[0];
    expect(screen.getByText(firstMarkerLabel)).toBeInTheDocument();
  });

  it("Workspace FASTA tab does not show marker buttons", async () => {
    const user = userEvent.setup();
    render(<PrimerDesignServicePage />, { wrapper: Providers });

    await user.click(screen.getByRole("tab", { name: /workspace fasta/i }));

    const firstMarkerLabel = Object.values(markerLabels)[0];
    expect(screen.queryByText(firstMarkerLabel)).not.toBeInTheDocument();
  });
});
