import type { AnyFieldApi } from "@tanstack/react-form";
import { checkWorkspaceObjectExists } from "@/lib/services/workspace/validation";

const nameTakenMessage =
  "An object with this name already exists in the selected folder.";

function readStringFormValue(fieldApi: AnyFieldApi, fieldName: string): string {
  const values = fieldApi.form.state.values;

  if (!values || typeof values !== "object") {
    return "";
  }

  const value = (values as Record<string, unknown>)[fieldName];
  return typeof value === "string" ? value : "";
}

export interface OutputNameValidatorOptions {
  outputPathFieldName?: string;
  checkExists?: typeof checkWorkspaceObjectExists;
}

export function createOutputNameValidator(options?: OutputNameValidatorOptions) {
  return async ({
    value,
    fieldApi,
    signal,
  }: {
    value: string;
    fieldApi: AnyFieldApi;
    signal: AbortSignal;
  }): Promise<string | undefined> => {
    const outputPathFieldName = options?.outputPathFieldName ?? "output_path";
    const outputPath = readStringFormValue(fieldApi, outputPathFieldName);
    const outputName = value.trim();
    const basePath = outputPath.trim().replace(/\/$/, "");

    if (!outputName || !basePath) return undefined;

    const exists = await (options?.checkExists ?? checkWorkspaceObjectExists)(
      `${basePath}/${outputName}`,
      { signal },
    );

    return exists ? nameTakenMessage : undefined;
  };
}
