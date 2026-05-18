"use client";

import { useCallback, useState } from "react";
import { validateYearRanges } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-utils";

interface UseMetaCatsYearRangesOptions {
  form: { setFieldValue: (...args: any[]) => void };
  yearRangesFieldName: string;
}

export interface UseMetaCatsYearRangesReturn {
  yearRangesInput: string;
  yearRangesValidation: { valid: boolean; message: string } | null;
  handleYearRangesChange: (value: string) => void;
  reset: () => void;
}

export function useMetaCatsYearRanges({
  form,
  yearRangesFieldName,
}: UseMetaCatsYearRangesOptions): UseMetaCatsYearRangesReturn {
  const [yearRangesInput, setYearRangesInput] = useState<string>("");
  const [yearRangesValidation, setYearRangesValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const handleYearRangesChange = useCallback(
    (value: string) => {
      setYearRangesInput(value);
      const validation = validateYearRanges(value);
      setYearRangesValidation(validation);
      form.setFieldValue(yearRangesFieldName, value);
    },
    [form, yearRangesFieldName],
  );

  const reset = useCallback(() => {
    setYearRangesInput("");
    setYearRangesValidation(null);
    form.setFieldValue(yearRangesFieldName, "");
  }, [form, yearRangesFieldName]);

  return {
    yearRangesInput,
    yearRangesValidation,
    handleYearRangesChange,
    reset,
  };
}
