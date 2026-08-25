"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { createPortal } from "react-dom";
import { Search, Loader2, ShieldUser, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchGenomesByIds, type GenomeSummary } from "@/lib/services/genome";
import { toast } from "sonner";
import {
  useGenomeTypeahead,
  shouldSearch,
} from "@/hooks/services/use-genome-typeahead";

interface SingleGenomeSelectorProps {
  id?: string;
  title?: string;
  placeholder?: string;
  helperText?: string;
  value: string;
  onChange: (genomeId: string) => void;
  disabled?: boolean;
  className?: string;
  minQueryLength?: number;
}

// Genome IDs match numeric patterns like "123.45"
function isGenomeId(str: string): boolean {
  return /^[0-9]+(\.[0-9]+)?$/.test(str.trim());
}

function useSingleGenomeSelector({
  id,
  title,
  placeholder = "e.g. Mycobacterium tuberculosis H37Rv",
  helperText,
  value,
  onChange,
  disabled = false,
  className,
  minQueryLength = 0,
}: SingleGenomeSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isManualTrigger, setIsManualTrigger] = useState(false);
  const selectedGenomeIdRef = useRef<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    setIsLoading,
    error,
    showDropdown,
    setShowDropdown,
    selectedItem: selectedGenome,
    setSelectedItem: setSelectedGenome,
    highlightedIndex,
    setHighlightedIndex,
    inputRef,
    dropdownRef,
    itemRefs,
    updateSuggestions,
    triggerSearch,
  } = useGenomeTypeahead({
    minQueryLength,
    disabled,
    skipFetch: (q, sel) => sel !== null && q.trim() === sel.genome_name,
    additionalClickOutsideRefs: [buttonRef, containerRef],
    onClickOutside: () => {
      setIsManualTrigger(false);
    },
  });

  // Sync query with value prop; resolve genome ID -> name via fetchGenomesByIds.
  const syncValue = useEffectEvent((nextValue: string) => {
    if (!nextValue) {
      if (query) {
        queueMicrotask(() => {
          setQuery("");
          setSelectedGenome(null);
        });
        selectedGenomeIdRef.current = null;
      }
      return;
    }

    if (isGenomeId(nextValue)) {
      if (
        (selectedGenome && selectedGenome.genome_id === nextValue) ||
        selectedGenomeIdRef.current === nextValue
      ) {
        return;
      }
      if (!selectedGenome || selectedGenome.genome_id !== nextValue) {
        queueMicrotask(() => {
          setIsLoading(true);
        });
        fetchGenomesByIds([nextValue])
          .then((results) => {
            if (results.length > 0) {
              const genome = results[0];
              selectedGenomeIdRef.current = genome.genome_id;
              setSelectedGenome(genome);
              setQuery(genome.genome_name);
            } else {
              setQuery(nextValue);
              setSelectedGenome(null);
            }
          })
          .catch(() => {
            setQuery(nextValue);
            setSelectedGenome(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      }
    }

    if (nextValue !== query) {
      if (selectedGenome && nextValue === selectedGenome.genome_name) {
        return;
      }
      queueMicrotask(() => {
        setQuery(nextValue);
        if (
          selectedGenome &&
          nextValue !== selectedGenome.genome_id &&
          nextValue !== selectedGenome.genome_name
        ) {
          setSelectedGenome(null);
        }
      });
    }
  });

  useEffect(() => {
    syncValue(value);
  }, [value]);

  // Compute portal position (avoids Card overflow-hidden clipping)
  const updateDropdownLayout = useEffectEvent(() => {
    if (!showDropdown || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const preferredHeight = 256;
    const minHeight = 160;
    const gap = 4;
    let top: number;
    let maxHeight: number;
    if (spaceBelow >= preferredHeight) {
      top = rect.bottom + gap;
      maxHeight = preferredHeight;
    } else if (spaceBelow >= minHeight) {
      top = rect.bottom + gap;
      maxHeight = Math.max(spaceBelow - gap, minHeight);
    } else {
      const spaceAbove = rect.top;
      maxHeight = Math.max(spaceAbove - gap, minHeight);
      top = rect.top - maxHeight - gap;
    }
    setDropdownRect({ top, left: rect.left, width: rect.width, maxHeight });
  });

  useEffect(() => {
    if (showDropdown && containerRef.current) {
      updateDropdownLayout();
    } else {
      setDropdownRect(null);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (!showDropdown) return;
    window.addEventListener("scroll", updateDropdownLayout, true);
    window.addEventListener("resize", updateDropdownLayout);
    return () => {
      window.removeEventListener("scroll", updateDropdownLayout, true);
      window.removeEventListener("resize", updateDropdownLayout);
    };
  }, [showDropdown]);

  const handleSelect = (genome: GenomeSummary) => {
    selectedGenomeIdRef.current = genome.genome_id;
    onChange(genome.genome_id);
    setQuery(genome.genome_name);
    setSelectedGenome(genome);
    updateSuggestions([]);
    setShowDropdown(false);
    setDropdownRect(null);
    setIsManualTrigger(false);
  };

  const handleManualDropdownToggle = () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) {
      setIsManualTrigger(true);
      triggerSearch("");
    } else {
      setDropdownRect(null);
      setIsManualTrigger(false);
    }
  };

  const handleManualSelect = async () => {
    if (selectedGenome) {
      handleSelect(selectedGenome);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      toast.error("Enter a genome name or ID first");
      return;
    }

    setIsLoading(true);
    const result = await fetchGenomesByIds([trimmed]).then(
      (results) => ({ results }),
      (error: unknown) => ({ error }),
    );
    if ("error" in result) {
      const message =
        result.error instanceof Error
          ? result.error.message
          : "Failed to add genome";
      toast.error(message);
    } else if (result.results.length === 0) {
      toast.error("Genome not found", {
        description: `${trimmed} was not found in BV-BRC`,
      });
    } else {
      handleSelect(result.results[0]);
    }
    setIsLoading(false);
  };

  useHotkey(
    "Enter",
    () => {
      if (!showDropdown || suggestions.length === 0) {
        void handleManualSelect();
      } else if (
        highlightedIndex >= 0 &&
        highlightedIndex < suggestions.length
      ) {
        handleSelect(suggestions[highlightedIndex]);
      } else {
        void handleManualSelect();
      }
    },
    {
      target: inputRef,
      ignoreInputs: false,
      conflictBehavior: "allow",
      preventDefault: true,
    },
  );

  const showEmptyState =
    (shouldSearch(query, minQueryLength) ||
      (isManualTrigger && !query.trim())) &&
    !isLoading &&
    !error &&
    suggestions.length === 0;

  return (
    <div className={cn("space-y-2", className)}>
      {title && <Label className="service-card-label">{title}</Label>}
      <div ref={containerRef} className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          ref={inputRef}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            const newValue = event.target.value;
            setQuery(newValue);
            setSelectedGenome(null);
            setHighlightedIndex(-1);
            setIsManualTrigger(false);
            setShowDropdown(true);
            if (selectedGenomeIdRef.current !== null) {
              onChange("");
              selectedGenomeIdRef.current = null;
            }
          }}
          onFocus={() => {
            if (query.length > 0 || isManualTrigger) {
              setShowDropdown(true);
            }
          }}
          className="service-card-input w-full pr-12 pl-10"
        />
        <Button
          ref={buttonRef}
          type="button"
          onClick={handleManualDropdownToggle}
          className="absolute top-1/2 right-3 size-4 -translate-y-1/2 bg-primary/15 text-primary transition-colors hover:bg-primary/25 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80"
          aria-label="Toggle dropdown"
        >
          <ChevronDown
            className={`size-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          />
        </Button>
        {showDropdown &&
          (suggestions.length > 0 ||
            isLoading ||
            error ||
            showEmptyState ||
            isManualTrigger) &&
          dropdownRect &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-40 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent overflow-y-auto rounded-md border bg-popover shadow-md hover:scrollbar-thumb-muted-foreground/40"
              style={{
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
                maxHeight: dropdownRect.maxHeight,
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Searching...
                  </span>
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-destructive">{error}</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((genome, index) => {
                  const isHighlighted = highlightedIndex === index;
                  return (
                    <button
                      key={genome.genome_id}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      type="button"
                      className={cn(
                        "flex w-full cursor-pointer flex-col items-start gap-1 rounded-md border-0 bg-transparent px-4 py-2 text-left text-sm hover:bg-accent",
                        isHighlighted && "bg-accent",
                      )}
                      onClick={() => {
                        handleSelect(genome);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(index);
                      }}
                    >
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {genome.public === false && (
                          <ShieldUser className="size-3.5 shrink-0 text-foreground/90" />
                        )}
                        <span className="truncate">{genome.genome_name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {genome.genome_id}
                        {genome.strain ? ` • ${genome.strain}` : ""}
                      </span>
                    </button>
                  );
                })
              ) : showEmptyState ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {query.trim()
                    ? `No genomes found for "${query.trim()}"`
                    : "No genomes found"}
                </p>
              ) : null}
            </div>,
            document.body,
          )}
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export function SingleGenomeSelector(props: SingleGenomeSelectorProps) {
  return useSingleGenomeSelector(props);
}
