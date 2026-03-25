"use client";

import { useState } from "react";
import Image from "next/image";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Code, ImageIcon, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProxyUrl } from "../file-viewer-registry";
import { TextViewer } from "./text-viewer";

interface SvgViewerProps {
  filePath: string;
  fileName: string;
}

export function SvgViewer({ filePath, fileName }: SvgViewerProps) {
  const [viewMode, setViewMode] = useState<"image" | "code">("image");

  const modeToggle = (
    <>
      <Button
        variant={viewMode === "image" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("image")}
      >
        <ImageIcon className="mr-1 h-4 w-4" />
        Image
      </Button>
      <Button
        variant={viewMode === "code" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("code")}
      >
        <Code className="mr-1 h-4 w-4" />
        Code
      </Button>
    </>
  );

  if (viewMode === "code") {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center gap-1 border-b border-border px-2 py-1">
          {modeToggle}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <TextViewer filePath={filePath} fileName={fileName} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <TransformWrapper>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="flex items-center gap-1 border-b border-border px-2 py-1">
              {modeToggle}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => zoomIn()}
                  title="Zoom in"
                >
                  <ZoomIn />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => zoomOut()}
                  title="Zoom out"
                >
                  <ZoomOut />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => resetTransform()}
                  title="Reset"
                >
                  <RotateCcw />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                <Image
                  src={getProxyUrl(filePath)}
                  alt={fileName}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-auto w-auto max-h-full max-w-full object-contain"
                  unoptimized
                />
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
