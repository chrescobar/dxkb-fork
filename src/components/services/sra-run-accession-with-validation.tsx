"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Library } from "@/types/services";
import { toast } from "sonner";

import { ChevronRight, Loader2 } from "lucide-react";

const validationDebounceMs = 500;

/** Strips HTML tags so only plain text is stored/displayed (XSS safety). */
function toPlainText(s: string): string {
  const text = new DOMParser().parseFromString(s, "text/html").body.textContent;
  return text.trim() || s;
}

interface ValidationResult {
  runs: string[];
  title: string;
}

interface SraRunAccessionWithValidationProps {
  title?: string;
  placeholder?: string;
  selectedLibraries: Library[];
  setSelectedLibraries: (libraries: Library[]) => void;
  disabled?: boolean;
  allowDuplicates?: boolean;
  onAdd?: (srrIds: string[], title?: string) => void;
  /** Called when the accession input value changes */
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  addButton?: React.ReactNode;
  /** Whether to show the label. Defaults to true. */
  showLabel?: boolean;
  /** Whether to show the ChevronRight add button. Defaults to true. When false, add via Enter key. */
  showAddButton?: boolean;
  /** Pre-populate the accession input (e.g. for rerun). */
  defaultValue?: string;
}

// Validation is now done via API proxy to avoid CORS issues

/**
 * Parses XML text and extracts data using XPath-like queries
 */
function parseXmlAndExtract(xmlText: string): {
  title: string;
  runs: string[];
  isValid: boolean;
} {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  // Check for parsing errors
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Failed to parse XML response");
  }

  let title = "";

  // Extract study title
  try {
    const studyTitle = xmlDoc.evaluate(
      "//STUDY/DESCRIPTOR/STUDY_TITLE//text()",
      xmlDoc,
      null,
      XPathResult.STRING_TYPE,
      null,
    );
    title = studyTitle.stringValue.trim();
  } catch (e) {
    console.error("Could not get title from SRA record:", e);
  }

  const runs: string[] = [];
  const _inputAccession = xmlDoc
    .evaluate(
      "//EXPERIMENT_PACKAGE/EXPERIMENT/@accession",
      xmlDoc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    .singleNodeValue?.textContent?.toLowerCase();

  // Extract all run accessions
  try {
    const runNodes = xmlDoc.evaluate(
      "//EXPERIMENT_PACKAGE_SET/EXPERIMENT_PACKAGE/RUN_SET/RUN/@accession",
      xmlDoc,
      null,
      XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
      null,
    );

    let runNode = runNodes.iterateNext();
    while (runNode) {
      const runId = runNode.textContent;
      if (runId) {
        runs.push(runId);
      }
      runNode = runNodes.iterateNext();
    }
  } catch (e) {
    console.error("Could not get run IDs from SRA record:", e);
  }

  return {
    title,
    runs,
    isValid: runs.length > 0,
  };
}

interface SraInputViewProps {
  variant: "label-and-add" | "label-only" | "add-only" | "input-only";
  validationStatus: "idle" | "validating" | "invalid" | "valid";
  title: string;
  placeholder: string;
  label?: React.ReactNode;
  addButton?: React.ReactNode;
  accession: string;
  disabled: boolean;
  validationMessage: string;
  onAdd: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function SraInputView({
  variant,
  validationStatus,
  title,
  placeholder,
  label,
  addButton,
  accession,
  disabled,
  validationMessage,
  onAdd,
  onChange,
  onKeyDown,
}: SraInputViewProps) {
  const hasLabel = variant === "label-and-add" || variant === "label-only";
  const hasAddButton = variant === "label-and-add" || variant === "add-only";
  const hasHeader = variant !== "input-only";

  return (
    <div className="space-y-2">
      {hasHeader && (
        <div className="flex items-center justify-between">
          {hasLabel ? (
            <>
              {label ?? <Label className="service-card-label">{title}</Label>}
              <div className="bg-border mx-4 h-px flex-1" />
            </>
          ) : (
            <div className="bg-border mx-4 h-px flex-1" />
          )}
          {hasAddButton &&
            (addButton ?? (
              <Button
                variant="outline"
                size="icon"
                aria-label="Add SRA run accession to selected libraries"
                onClick={onAdd}
                disabled={
                  !accession.trim() ||
                  disabled ||
                  validationStatus === "validating"
                }
              >
                {validationStatus === "validating" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            ))}
        </div>
      )}
      <div className="space-y-2">
        <Input
          className="service-card-input"
          placeholder={placeholder}
          value={accession}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled || validationStatus === "validating"}
        />
        {validationMessage && (
          <p
            className={`text-sm ${
              validationMessage.includes("Validating")
                ? "text-muted-foreground"
                : "text-destructive"
            }`}
          >
            {validationMessage}
          </p>
        )}
        {validationStatus === "valid" && !validationMessage && (
          <p className="text-muted-foreground text-sm">Provided SRA is valid</p>
        )}
      </div>
    </div>
  );
}

const SraRunAccessionWithValidation = ({
  title = "SRA Run Accession",
  placeholder = "SRR...",
  selectedLibraries,
  setSelectedLibraries,
  disabled = false,
  allowDuplicates = false,
  onAdd,
  onChange,
  label,
  addButton,
  showLabel = true,
  showAddButton = true,
  defaultValue = "",
}: SraRunAccessionWithValidationProps) => {
  const [sraAccession, setSraAccession] = useState(defaultValue);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [isValidSra, setIsValidSra] = useState(false);
  const validationCacheRef = useRef<{
    accession: string;
    result: ValidationResult;
  } | null>(null);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedLibrariesRef = useRef(selectedLibraries);
  useLayoutEffect(() => {
    selectedLibrariesRef.current = selectedLibraries;
  }, [selectedLibraries]);

  const applyValidationResult = (
    accession: string,
    result: ValidationResult,
    options?: { skipClear?: boolean },
  ) => {
    const { runs, title: studyTitle } = result;
    const skipClear = options?.skipClear ?? false;
    const current = selectedLibrariesRef.current;

    // Timeout case: accession is a single run
    if (runs.length === 1 && runs[0] === accession) {
      const isDuplicate = current.some(
        (lib) => lib.id === accession && lib.type === "sra",
      );
      if (isDuplicate && !allowDuplicates) {
        toast.error("Duplicate SRA accession detected", {
          description: `SRA accession ${accession} has already been added.`,
        });
        return;
      }
      const newLibrary: Library = {
        id: accession,
        name: accession,
        type: "sra",
      };
      setSelectedLibraries([...current, newLibrary]);
      onAdd?.([accession]);
    } else {
      const newLibraries: Library[] = [];
      for (const runId of runs) {
        const isDuplicate = current.some(
          (lib) => lib.id === runId && lib.type === "sra",
        );
        if (isDuplicate && !allowDuplicates) {
          toast.error("Duplicate SRA accession detected", {
            description: `SRA accession ${runId} has already been added.`,
          });
          continue;
        }
        newLibraries.push({
          id: runId,
          name: runId,
          type: "sra",
          ...(studyTitle && { title: studyTitle }),
        });
      }
      if (newLibraries.length > 0) {
        setSelectedLibraries([...current, ...newLibraries]);
        onAdd?.(runs, studyTitle);
      }
    }

    if (!skipClear) {
      setSraAccession("");
      onChange?.("");
      setValidationMessage("");
      setIsValidSra(false);
      validationCacheRef.current = null;
    }
  };

  const validateAccession = async (
    accession: string,
  ): Promise<ValidationResult | null> => {
    if (!accession.match(/^[a-z]{3}[0-9]+$/i)) {
      setValidationMessage(
        "Your input is not valid. Hint: only one SRR at a time.",
      );
      setIsValidSra(false);
      return null;
    }

    setIsValidating(true);
    setIsValidSra(false);
    setValidationMessage(`Validating ${accession}...`);

    return fetch(
      `/api/services/sra-validation?accession=${encodeURIComponent(accession)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
    )
      .then(async (response): Promise<ValidationResult | null> => {
        if (!response.ok) {
          const errorData = await (response.json() as Promise<{
            error?: unknown;
          }>);
          const rawError =
            errorData.error == null
              ? ""
              : typeof errorData.error === "string"
                ? errorData.error
                : JSON.stringify(errorData.error);
          const plainError = rawError
            ? toPlainText(rawError)
            : `Your input ${accession} is not valid`;
          setValidationMessage(plainError);
          setIsValidSra(false);
          return null;
        }

        const data = await (response.json() as Promise<{
          timeout?: boolean;
          xml?: string;
        }>);

        if (data.timeout) {
          setValidationMessage("Timeout exceeded.");
          validationCacheRef.current = {
            accession,
            result: { runs: [accession], title: "" },
          };
          setIsValidSra(true);
          return validationCacheRef.current.result;
        }

        const {
          title: studyTitle,
          runs,
          isValid,
        } = parseXmlAndExtract(data.xml ?? "");
        if (!isValid || runs.length === 0) {
          setValidationMessage("The accession is not a run id.");
          setIsValidSra(false);
          return null;
        }

        setValidationMessage("");
        setIsValidSra(true);
        const result: ValidationResult = { runs, title: studyTitle };
        validationCacheRef.current = { accession, result };
        return result;
      })
      .catch((error: unknown) => {
        console.error("Error validating SRA accession:", error);
        const message =
          error instanceof Error
            ? toPlainText(error.message)
            : "Something went wrong during validation.";
        setValidationMessage(message);
        setIsValidSra(false);
        return null;
      })
      .finally(() => {
        setIsValidating(false);
      });
  };

  const scheduleValidation = (accession: string) => {
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    if (!accession) {
      validationCacheRef.current = null;
      setValidationMessage("");
      setIsValidSra(false);
      return;
    }
    validationTimerRef.current = setTimeout(() => {
      validationTimerRef.current = null;
      void validateAccession(accession).then((result) => {
        if (result && !showAddButton) {
          const alreadyAdded = result.runs.every((runId) =>
            selectedLibrariesRef.current.some(
              (library) => library.type === "sra" && library.id === runId,
            ),
          );
          if (!alreadyAdded) {
            applyValidationResult(accession, result, { skipClear: true });
          }
        }
      });
    }, validationDebounceMs);
  };

  const validateDefaultValue = useEffectEvent((accession: string) => {
    void validateAccession(accession).then((result) => {
      if (result && !showAddButton) {
        const alreadyAdded = result.runs.every((runId) =>
          selectedLibrariesRef.current.some(
            (library) => library.type === "sra" && library.id === runId,
          ),
        );
        if (!alreadyAdded) {
          applyValidationResult(accession, result, { skipClear: true });
        }
      }
    });
  });

  useEffect(() => {
    const accession = defaultValue.trim();
    if (accession) {
      validationTimerRef.current = setTimeout(() => {
        validationTimerRef.current = null;
        validateDefaultValue(accession);
      }, validationDebounceMs);
    }
    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, [defaultValue, validationDebounceMs]);

  const handleAdd = async () => {
    const accession = sraAccession.trim();
    if (!accession) return;

    const cached = validationCacheRef.current;
    if (cached && cached.accession === accession) {
      applyValidationResult(accession, cached.result);
      return;
    }

    const result = await validateAccession(accession);
    if (result) {
      applyValidationResult(accession, result);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSraAccession(value);
    if (validationMessage) setValidationMessage("");
    setIsValidSra(false);
    scheduleValidation(value.trim());
    onChange?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !showAddButton) {
      e.preventDefault();
      void handleAdd();
    }
  };

  const inputVariant = showLabel
    ? showAddButton
      ? "label-and-add"
      : "label-only"
    : showAddButton
      ? "add-only"
      : "input-only";
  const validationStatus = isValidating
    ? "validating"
    : validationMessage
      ? "invalid"
      : isValidSra
        ? "valid"
        : "idle";

  return (
    <SraInputView
      variant={inputVariant}
      validationStatus={validationStatus}
      title={title}
      placeholder={placeholder}
      label={label}
      addButton={addButton}
      accession={sraAccession}
      disabled={disabled}
      validationMessage={validationMessage}
      onAdd={() => {
        void handleAdd();
      }}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
    />
  );
};

export default SraRunAccessionWithValidation;
