import { renderHook, act } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";

import { useLibraryInputState } from "@/hooks/services/use-library-input-state";
import type { Library } from "@/types/services";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function createMockForm() {
  return {
    setFieldValue: vi.fn(),
    store: {},
  } as never;
}

const fields = {
  paired: "paired_end_libs",
  single: "single_end_libs",
  srr: "srr_ids",
};

function makeLibrary(overrides: Partial<Library> = {}): Library {
  return {
    id: "lib-1",
    name: "Test Library",
    type: "paired",
    files: ["/ws/r1.fq", "/ws/r2.fq"],
    ...overrides,
  };
}

describe("useLibraryInputState", () => {
  describe("handlePairedLibraryAdd", () => {
    it("calls buildPairedLibrary and resets reads after add", () => {
      const buildPairedLibrary = vi.fn((_r1: string, _r2: string, id: string) => ({
        library: makeLibrary({ id, type: "paired", files: [_r1, _r2] }),
      }));
      const buildSingleLibrary = vi.fn(() => ({ library: undefined }));

      const form = createMockForm();

      const { result } = renderHook(() =>
        useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
        }),
      );

      act(() => {
        result.current.setPairedRead1("/ws/r1.fq");
        result.current.setPairedRead2("/ws/r2.fq");
      });

      expect(result.current.pairedRead1).toBe("/ws/r1.fq");
      expect(result.current.pairedRead2).toBe("/ws/r2.fq");

      act(() => {
        result.current.handlePairedLibraryAdd();
      });

      expect(buildPairedLibrary).toHaveBeenCalledWith(
        "/ws/r1.fq",
        "/ws/r2.fq",
        expect.any(String),
      );

      // Reads should be reset after a successful add
      expect(result.current.pairedRead1).toBeNull();
      expect(result.current.pairedRead2).toBeNull();

      // Library should appear in selectedLibraries
      expect(result.current.selectedLibraries).toHaveLength(1);
    });
  });

  describe("handleSingleLibraryAdd", () => {
    it("calls buildSingleLibrary and resets singleRead after add", () => {
      const buildPairedLibrary = vi.fn(() => ({ library: undefined }));
      const buildSingleLibrary = vi.fn((read: string) => ({
        library: makeLibrary({ id: read, type: "single", files: [read] }),
      }));

      const form = createMockForm();

      const { result } = renderHook(() =>
        useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
        }),
      );

      act(() => {
        result.current.setSingleRead("/ws/reads.fq");
      });

      expect(result.current.singleRead).toBe("/ws/reads.fq");

      act(() => {
        result.current.handleSingleLibraryAdd();
      });

      expect(buildSingleLibrary).toHaveBeenCalledWith("/ws/reads.fq");

      // singleRead should be reset after a successful add
      expect(result.current.singleRead).toBeNull();

      // Library should appear in selectedLibraries
      expect(result.current.selectedLibraries).toHaveLength(1);
    });
  });

  describe("resetInputState", () => {
    it("clears all three reads and increments sraResetKey", () => {
      const buildPairedLibrary = vi.fn(() => ({ library: undefined }));
      const buildSingleLibrary = vi.fn(() => ({ library: undefined }));

      const form = createMockForm();

      const { result } = renderHook(() =>
        useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
        }),
      );

      act(() => {
        result.current.setPairedRead1("/ws/r1.fq");
        result.current.setPairedRead2("/ws/r2.fq");
        result.current.setSingleRead("/ws/reads.fq");
      });

      const previousSraResetKey = result.current.sraResetKey;

      act(() => {
        result.current.resetInputState();
      });

      expect(result.current.pairedRead1).toBeNull();
      expect(result.current.pairedRead2).toBeNull();
      expect(result.current.singleRead).toBeNull();
      expect(result.current.sraResetKey).toBe(previousSraResetKey + 1);
    });
  });

  describe("onPairedError", () => {
    it("fires when buildPairedLibrary returns error", () => {
      const onPairedError = vi.fn();
      const buildPairedLibrary = vi.fn(() => ({ error: "Build failed for paired" }));
      const buildSingleLibrary = vi.fn(() => ({ library: undefined }));

      const form = createMockForm();

      const { result } = renderHook(() =>
        useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
          onPairedError,
        }),
      );

      act(() => {
        result.current.setPairedRead1("/ws/r1.fq");
        result.current.setPairedRead2("/ws/r2.fq");
      });

      act(() => {
        result.current.handlePairedLibraryAdd();
      });

      expect(onPairedError).toHaveBeenCalledWith("Build failed for paired");
    });
  });

  describe("default toast.error fallback for paired errors", () => {
    it("calls toast.error when onPairedError is not provided and buildPairedLibrary returns error", async () => {
      const { toast } = await import("sonner");
      const buildPairedLibrary = vi.fn(() => ({ error: "Paired build error" }));
      const buildSingleLibrary = vi.fn(() => ({ library: undefined }));

      const form = createMockForm();

      const { result } = renderHook(() =>
        useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
          // onPairedError intentionally omitted — the hook should use toast.error
        }),
      );

      act(() => {
        result.current.setPairedRead1("/ws/r1.fq");
        result.current.setPairedRead2("/ws/r2.fq");
      });

      act(() => {
        result.current.handlePairedLibraryAdd();
      });

      expect(toast.error).toHaveBeenCalledWith("Paired build error");
    });
  });

  describe("default toast.error fallback for single errors", () => {
    it("calls toast.error when onSingleError is not provided and buildSingleLibrary returns error", async () => {
      const { toast } = await import("sonner");
      const buildPairedLibrary = vi.fn(() => ({ library: undefined }));
      const buildSingleLibrary = vi.fn(() => ({ error: "Single build error" }));

      const form = createMockForm();

      const { result } = renderHook(() =>
        useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
          // onSingleError intentionally omitted — the hook should use toast.error
        }),
      );

      act(() => {
        result.current.setSingleRead("/ws/reads.fq");
      });

      act(() => {
        result.current.handleSingleLibraryAdd();
      });

      expect(toast.error).toHaveBeenCalledWith("Single build error");
    });
  });

  describe("useForm integration", () => {
    it("integrates with TanStack Form and updates form values on add", () => {
      const buildSingleLibrary = vi.fn((read: string) => ({
        library: makeLibrary({ id: read, type: "single", files: [read] }),
      }));
      const buildPairedLibrary = vi.fn(() => ({ library: undefined }));

      const { result } = renderHook(() => {
        const form = useForm({
          defaultValues: {
            paired_end_libs: [] as { _id: string; _type: string }[],
            single_end_libs: [] as { _id: string; _type: string }[],
            srr_ids: [] as string[],
          },
          onSubmit: vi.fn(),
        });

        const state = useLibraryInputState({
          form,
          mapLibraryToItem: (lib: Library) => ({ _id: lib.id, _type: lib.type }),
          fields,
          buildPairedLibrary,
          buildSingleLibrary,
        });

        return { form, state };
      });

      act(() => {
        result.current.state.setSingleRead("/ws/reads.fq");
      });

      act(() => {
        result.current.state.handleSingleLibraryAdd();
      });

      expect(result.current.state.selectedLibraries).toHaveLength(1);
      expect(result.current.state.singleRead).toBeNull();
    });
  });
});
