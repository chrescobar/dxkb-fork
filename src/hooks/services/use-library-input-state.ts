"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useTanstackLibrarySelection,
  type UseTanstackLibrarySelectionConfig,
} from "@/lib/forms/tanstack-library-selection";
import type { Library } from "@/types/services";

export interface UseLibraryInputStateOptions<LibraryItem, SrrItem = string>
  extends UseTanstackLibrarySelectionConfig<LibraryItem, SrrItem> {
  buildPairedLibrary: (
    read1: string,
    read2: string,
    id: string,
  ) => { library?: Library; error?: string };
  buildSingleLibrary: (read: string) => { library?: Library; error?: string };
  duplicateMatcher?: (library: Library, read: string) => boolean;
  onPairedError?: (msg: string) => void;
  onSingleError?: (msg: string) => void;
}

export function useLibraryInputState<LibraryItem, SrrItem = string>(
  options: UseLibraryInputStateOptions<LibraryItem, SrrItem>,
) {
  const [pairedRead1, setPairedRead1] = useState<string | null>(null);
  const [pairedRead2, setPairedRead2] = useState<string | null>(null);
  const [singleRead, setSingleRead] = useState<string | null>(null);
  const [sraResetKey, setSraResetKey] = useState(0);

  const selection = useTanstackLibrarySelection<LibraryItem, SrrItem>(options);

  const handlePairedLibraryAdd = useCallback(() => {
    selection.addPairedLibrary({
      read1: pairedRead1,
      read2: pairedRead2,
      buildLibrary: options.buildPairedLibrary,
      onError: options.onPairedError ?? ((m: string) => toast.error(m)),
      onAfterAdd: () => {
        setPairedRead1(null);
        setPairedRead2(null);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairedRead1, pairedRead2, options.buildPairedLibrary, options.onPairedError, selection.addPairedLibrary]);

  const handleSingleLibraryAdd = useCallback(() => {
    selection.addSingleLibrary({
      read: singleRead,
      buildLibrary: options.buildSingleLibrary,
      duplicateMatcher: options.duplicateMatcher,
      onError: options.onSingleError ?? ((m: string) => toast.error(m)),
      onAfterAdd: () => setSingleRead(null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleRead, options.buildSingleLibrary, options.duplicateMatcher, options.onSingleError, selection.addSingleLibrary]);

  const resetInputState = useCallback(() => {
    setPairedRead1(null);
    setPairedRead2(null);
    setSingleRead(null);
    setSraResetKey((k) => k + 1);
  }, []);

  return {
    ...selection,
    pairedRead1,
    pairedRead2,
    singleRead,
    sraResetKey,
    setPairedRead1,
    setPairedRead2,
    setSingleRead,
    handlePairedLibraryAdd,
    handleSingleLibraryAdd,
    resetInputState,
  };
}
