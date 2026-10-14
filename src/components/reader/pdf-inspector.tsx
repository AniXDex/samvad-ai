"use client";

import * as React from "react";
import { ZoomIn, ZoomOut, RotateCcw, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PdfInspectorProps {
  documentTitle: string;
  fileUrl?: string;
  activeLocator?: string | null;
  className?: string;
}

export function PdfInspector({
  documentTitle,
  fileUrl,
  activeLocator,
  className,
}: PdfInspectorProps): React.JSX.Element {
  const [zoom, setZoom] = React.useState(100);
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = 1;

  const isPdf = fileUrl ? fileUrl.toLowerCase().includes(".pdf") : false;

  return (
    <div className={cn("flex flex-col h-full rounded-2xl border border-border/80 bg-card overflow-hidden shadow-soft", className)}>
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-brand" />
          <span className="font-story text-sm font-semibold truncate max-w-[200px] text-foreground">
            {documentTitle}
          </span>
          {activeLocator && (
            <Badge variant="gold" className="text-[0.65rem] animate-pulse">
              Locator: {activeLocator}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-full border border-border/60 bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.max(60, z - 15))}
              disabled={zoom <= 60}
              aria-label="Zoom out"
            >
              <ZoomOut className="size-3" />
            </Button>
            <span className="text-[0.7rem] font-mono px-2 text-muted-foreground select-none">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.min(180, z + 15))}
              disabled={zoom >= 180}
              aria-label="Zoom in"
            >
              <ZoomIn className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom(100)}
              aria-label="Reset zoom"
            >
              <RotateCcw className="size-3" />
            </Button>
          </div>

          {fileUrl && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => window.open(fileUrl, "_blank")}
              aria-label="Open in new tab"
            >
              <ExternalLink className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Main viewer viewport */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-canvas relative dot-grid">
        {fileUrl ? (
          <div
            className="transition-transform duration-200 origin-top shadow-float rounded-lg overflow-hidden bg-background ring-1 ring-foreground/10"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                className="w-[650px] h-[820px] border-none"
                title="Document PDF preview"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl}
                alt="FIR Case Evidence"
                className="max-w-[700px] object-contain rounded-lg"
              />
            )}
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FileText className="size-6 text-brand" />
            </div>
            <h4 className="font-story text-base font-semibold">No Document Attached Yet</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload an FIR scanned copy, incident report, or case photograph to activate the document inspector with live citation bounding box highlights.
            </p>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-mono text-[0.7rem]">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="h-5 w-5 text-xs"
          >
            ‹
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="h-5 w-5 text-xs"
          >
            ›
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[0.7rem] font-medium text-foreground">
            Sovereign Mistral OCR Active
          </span>
        </div>
      </div>
    </div>
  );
}
