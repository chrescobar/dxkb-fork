"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import SraRunAccessionWithValidation from "@/components/services/sra-run-accession-with-validation";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import type { Library, ServiceInfoPopup } from "@/types/services";

interface LibraryInputCardProps {
  title: string;
  infoPopup?: ServiceInfoPopup;
  pairedRead1: string | null;
  pairedRead2: string | null;
  singleRead: string | null;
  sraResetKey: number;
  selectedLibraries: Library[];
  setPairedRead1: (path: string | null) => void;
  setPairedRead2: (path: string | null) => void;
  setSingleRead: (path: string | null) => void;
  setLibraries: (libs: Library[]) => void;
  onPairedAdd: () => void;
  onSingleAdd: () => void;
  pairedExtras?: ReactNode;
  singleExtras?: ReactNode;
  sraExtras?: ReactNode;
  pairedAddDisabled?: boolean;
  singleAddDisabled?: boolean;
  onPairedRead1Select?: (path: string) => void;
  onSingleReadSelect?: (path: string) => void;
  onSraChange?: (value: string) => void;
}

export function LibraryInputCard({
  title,
  infoPopup,
  pairedRead1,
  pairedRead2,
  singleRead,
  sraResetKey,
  selectedLibraries,
  setPairedRead1,
  setPairedRead2,
  setSingleRead,
  setLibraries,
  onPairedAdd,
  onSingleAdd,
  pairedExtras,
  singleExtras,
  sraExtras,
  pairedAddDisabled,
  singleAddDisabled,
  onPairedRead1Select,
  onSingleReadSelect,
  onSraChange,
}: LibraryInputCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="service-card-header">
        <RequiredFormCardTitle className="service-card-title">
          {title}
          {infoPopup && <DialogInfoPopup {...infoPopup} />}
        </RequiredFormCardTitle>
      </CardHeader>
      <CardContent className="service-card-content space-y-6">
        {/* Paired */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="service-card-label">Paired Read Library</Label>
            <div className="bg-border mx-4 h-px flex-1" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onPairedAdd}
              disabled={pairedAddDisabled ?? (!pairedRead1 || !pairedRead2)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="space-y-3">
            <WorkspaceObjectSelector
              preset="reads"
              placeholder="Select READ FILE 1..."
              value={pairedRead1 ?? ""}
              onObjectSelect={(obj) => {
                setPairedRead1(obj.path);
                onPairedRead1Select?.(obj.path);
              }}
            />
            <WorkspaceObjectSelector
              preset="reads"
              placeholder="Select READ FILE 2..."
              value={pairedRead2 ?? ""}
              onObjectSelect={(obj) => setPairedRead2(obj.path)}
            />
          </div>
          {pairedExtras}
        </div>

        {/* Single */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="service-card-label">Single Read Library</Label>
            <div className="bg-border mx-4 h-px flex-1" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSingleAdd}
              disabled={singleAddDisabled ?? !singleRead}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          <WorkspaceObjectSelector
            preset="reads"
            placeholder="Select READ FILE..."
            value={singleRead ?? ""}
            onObjectSelect={(obj) => {
              setSingleRead(obj.path);
              onSingleReadSelect?.(obj.path);
            }}
          />
          {singleExtras}
        </div>

        {/* SRA */}
        <SraRunAccessionWithValidation
          key={sraResetKey}
          title="SRA Run Accession"
          placeholder="SRR..."
          selectedLibraries={selectedLibraries}
          setSelectedLibraries={setLibraries}
          allowDuplicates={false}
          onChange={onSraChange}
        />
        {sraExtras}
      </CardContent>
    </Card>
  );
}
