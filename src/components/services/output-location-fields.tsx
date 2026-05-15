"use client";

import { useStore } from "@tanstack/react-form";

import { FieldItem, FieldErrors } from "@/components/ui/tanstack-form";
import OutputFolder from "@/components/services/output-folder";

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
  // Subscribe to output_path so OutputFolder re-validates when the folder changes.
  const outputPath = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => (s.values[outputPathName] as string) ?? "",
  );

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
              outputFolderPath={outputPath}
              onValidationChange={(isValid) => {
                field.setMeta((prev) => ({
                  ...prev,
                  errorMap: {
                    ...prev.errorMap,
                    onChange: isValid ? undefined : nameTakenMessage,
                  },
                }));
              }}
            />
          </FieldItem>
        )}
      </form.Field>
    </>
  );
}
