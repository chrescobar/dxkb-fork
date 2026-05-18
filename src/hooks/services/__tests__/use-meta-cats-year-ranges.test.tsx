import { renderHook, act } from "@testing-library/react";
import { useMetaCatsYearRanges } from "@/hooks/services/use-meta-cats-year-ranges";

function makeForm() {
  const setFieldValueFn = vi.fn();
  const mockForm = {
    setFieldValue: setFieldValueFn,
  };
  return { form: mockForm, setFieldValue: setFieldValueFn };
}

describe("useMetaCatsYearRanges", () => {
  it("starts with empty input and null validation", () => {
    const { form } = makeForm();

    const { result } = renderHook(() =>
      useMetaCatsYearRanges({
        form,
        yearRangesFieldName: "year_ranges",
      }),
    );

    expect(result.current.yearRangesInput).toBe("");
    expect(result.current.yearRangesValidation).toBeNull();
  });

  it("handleYearRangesChange validates a valid range", () => {
    const { form } = makeForm();

    const { result } = renderHook(() =>
      useMetaCatsYearRanges({
        form,
        yearRangesFieldName: "year_ranges",
      }),
    );

    act(() => {
      result.current.handleYearRangesChange("1998,1999-2005,2006");
    });

    expect(result.current.yearRangesInput).toBe("1998,1999-2005,2006");
    expect(result.current.yearRangesValidation).toMatchObject({ valid: true });
  });

  it("handleYearRangesChange validates an invalid range", () => {
    const { form } = makeForm();

    const { result } = renderHook(() =>
      useMetaCatsYearRanges({
        form,
        yearRangesFieldName: "year_ranges",
      }),
    );

    act(() => {
      result.current.handleYearRangesChange("abc-def");
    });

    expect(result.current.yearRangesValidation).toMatchObject({ valid: false });
  });

  it("handleYearRangesChange syncs the value to the form", () => {
    const { form, setFieldValue } = makeForm();

    const { result } = renderHook(() =>
      useMetaCatsYearRanges({
        form,
        yearRangesFieldName: "year_ranges",
      }),
    );

    act(() => {
      result.current.handleYearRangesChange("2000-2010");
    });

    expect(setFieldValue).toHaveBeenCalledWith("year_ranges", "2000-2010");
  });

  it("reset() clears input, validation, and syncs empty string to form", () => {
    const { form, setFieldValue } = makeForm();

    const { result } = renderHook(() =>
      useMetaCatsYearRanges({
        form,
        yearRangesFieldName: "year_ranges",
      }),
    );

    act(() => {
      result.current.handleYearRangesChange("1998,1999-2005");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.yearRangesInput).toBe("");
    expect(result.current.yearRangesValidation).toBeNull();
    expect(setFieldValue).toHaveBeenLastCalledWith("year_ranges", "");
  });

  it("empty string input does not produce an error validation", () => {
    const { form } = makeForm();

    const { result } = renderHook(() =>
      useMetaCatsYearRanges({
        form,
        yearRangesFieldName: "year_ranges",
      }),
    );

    act(() => {
      result.current.handleYearRangesChange("");
    });

    expect(result.current.yearRangesValidation).toMatchObject({ valid: true });
  });
});
