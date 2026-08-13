"use client";

import React, { useEffect, useEffectEvent, useRef, useState } from "react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import { checkWorkspaceObjectExists } from "@/lib/services/workspace/validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { HelpCircle } from "lucide-react";

const debounceMs = 350;
const nameTakenMessage =
  "An object with this name already exists in the selected folder.";

interface OutputFolderProps {
  title?: boolean;
  required?: boolean;
  tooltipContent?: boolean;
  placeholder?: string;
  buttonIcon?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  variant?: "default" | "name";
  outputFolderPath?: string;
  onValidationChange?: (valid: boolean) => void;
}

function buildFullPath(outputFolderPath: string, name: string): string {
  const base = outputFolderPath.replace(/\/$/, "");
  const trimmed = name.trim();
  return trimmed ? `${base}/${trimmed}` : "";
}

const OutputFolder = ({
  title = true,
  required = false,
  tooltipContent = true,
  placeholder,
  value = "",
  onChange,
  disabled = false,
  variant = "default",
  outputFolderPath = "",
  onValidationChange,
}: OutputFolderProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const checkIdRef = useRef(0);
  const notifyValidation = useEffectEvent((valid: boolean) => {
    onValidationChange?.(valid);
  });

  const runCheck = useEffectEvent(
    async (folderPath: string, name: string, checkId: number) => {
      const fullPath = buildFullPath(folderPath, name);
      if (!fullPath) {
        setNameTaken(false);
        notifyValidation(true);
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsChecking(true);
      setNameTaken(false);

      const exists = await checkWorkspaceObjectExists(fullPath, {
        signal: controller.signal,
      });

      if (controller.signal.aborted || checkId !== checkIdRef.current) return;

      setIsChecking(false);
      setNameTaken(exists);
      notifyValidation(!exists);
    },
  );

  const needsValidation =
    variant === "name" && !!outputFolderPath.trim() && !!value.trim();
  const validationKey = needsValidation ? `${outputFolderPath}\0${value}` : "";
  const [pendingValidationKey, setPendingValidationKey] = useState("");
  const pendingValidation =
    needsValidation && pendingValidationKey !== validationKey;
  const [prevNeedsValidation, setPrevNeedsValidation] =
    useState(needsValidation);
  if (prevNeedsValidation && !needsValidation) {
    setPrevNeedsValidation(needsValidation);
    setIsChecking(false);
    setNameTaken(false);
  } else if (prevNeedsValidation !== needsValidation) {
    setPrevNeedsValidation(needsValidation);
  }

  useEffect(() => {
    const checkId = ++checkIdRef.current;
    abortControllerRef.current?.abort();
    if (!needsValidation) {
      notifyValidation(true);
      return;
    }

    notifyValidation(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setPendingValidationKey(validationKey);
      void runCheck(outputFolderPath, value, checkId);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [needsValidation, outputFolderPath, value, validationKey]);

  const resolvedTitle = variant === "default" ? "Output Folder" : "Output Name";

  const resolvedPlaceholder =
    placeholder ??
    (variant === "default"
      ? "Select Output Folder..."
      : "Select Output Name...");

  const resolvedTooltipText =
    variant === "default"
      ? "The workspace folder where results will be placed."
      : "The name of the output file. This will appear in the specified output folder when the annotation job is complete.";

  return (
    <div className="space-y-0">
      {title && (
        <div className="flex flex-row items-center gap-2">
          <Label className="service-card-label">{resolvedTitle}</Label>
          {tooltipContent && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  aria-label={`${resolvedTitle} help`}
                  render={
                    <HelpCircle className="service-card-tooltip-icon mb-2" />
                  }
                />
                <TooltipContent className="max-w-sm font-normal text-white">
                  {resolvedTooltipText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {required && <span className="text-red-500">*</span>}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          {variant === "default" && (
            <WorkspaceObjectSelector
              preset="folder"
              placeholder="Search for folders..."
              value={value}
              onObjectSelect={(object) => {
                onChange?.(object.path || "");
              }}
            />
          )}
          {variant === "name" && (
            <div className="flex flex-1 items-center gap-2">
              <Input
                className="service-card-input"
                placeholder={resolvedPlaceholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                aria-invalid={pendingValidation || isChecking || nameTaken}
                aria-label={resolvedTitle}
              />
            </div>
          )}
        </div>
        {variant === "name" && !isChecking && nameTaken && (
          <p className="text-destructive text-sm" role="alert">
            {nameTakenMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default OutputFolder;
