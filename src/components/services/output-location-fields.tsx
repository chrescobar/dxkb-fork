"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@tanstack/react-form";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import OutputFolder from "@/components/services/output-folder";
import { checkWorkspaceObjectExists } from "@/lib/services/workspace/validation";

const debounceMs = 350;
const nameTakenMessage =
  "An object with this name already exists in the selected folder.";

// Only Field and store are needed from the form API; keep this minimal
// so all concrete ReactFormExtendedApi<T> instances are assignable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServiceForm { Field: any; store: any }

interface OutputLocationFieldsProps {
  form: ServiceForm;
  outputPathName?: string;
  outputNameName?: string;
  required?: boolean;
  disabled?: boolean;
}

export function OutputLocationFields({
  form,
  outputPathName = "output_path",
  outputNameName = "output_file",
  required = false,
  disabled = false,
}: OutputLocationFieldsProps) {
  // Subscribe to both fields so the check re-runs when either changes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputPath = useStore(form.store, (s: any) => (s.values[outputPathName] as string) ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputName = useStore(form.store, (s: any) => (s.values[outputNameName] as string) ?? "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const basePath = outputPath.trim().replace(/\/$/, "");
    const name = outputName.trim();

    // setFieldMeta expects DeepKeys<T>, not string. The `any` cast is necessary
    // here because ServiceForm intentionally avoids the generic form type.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const setError = (error: string | undefined) =>
      (form as any).setFieldMeta(outputNameName, (prev: any) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onChange: error },
      }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!basePath || !name) {
      setError(undefined);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      const exists = await checkWorkspaceObjectExists(`${basePath}/${name}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setError(exists ? nameTakenMessage : undefined);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [outputPath, outputName, form, outputNameName]);

  return (
    <>
      <form.Field name={outputPathName}>
        {(field) => (
          <FieldItem>
            <OutputFolder
              required={required}
              value={(field.state.value as string) ?? ""}
              onChange={field.handleChange as (value: string) => void}
            />
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>
      <form.Field name={outputNameName}>
        {(field) => (
          <FieldItem>
            <OutputFolder
              variant="name"
              required={required}
              disabled={disabled}
              value={(field.state.value as string) ?? ""}
              onChange={field.handleChange as (value: string) => void}
            />
            <FieldErrors field={field} />
          </FieldItem>
        )}
      </form.Field>
    </>
  );
}
