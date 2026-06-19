"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, Presentation } from "lucide-react";
import type { SocialPost } from "@/lib/types";
import { exportToExcel, exportToPDF } from "@/lib/export";
import type { ReportPptxPayload } from "@/lib/export-pptx-types";

interface ExportButtonsProps {
  posts: SocialPost[];
  reportTitle: string;
  filenameBase: string;
  pptxData?: ReportPptxPayload;
}

export function ExportButtons({
  posts,
  reportTitle,
  filenameBase,
  pptxData,
}: ExportButtonsProps) {
  const [exportingPptx, setExportingPptx] = useState(false);
  const [pptxStatus, setPptxStatus] = useState<string | null>(null);

  async function handlePowerPointExport() {
    if (!pptxData || exportingPptx) return;

    const filename = `${filenameBase}.pptx`;
    setExportingPptx(true);
    setPptxStatus("Preparing deck…");

    try {
      const response = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: pptxData, filename }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          errorBody &&
          typeof errorBody === "object" &&
          "error" in errorBody &&
          typeof errorBody.error === "string"
            ? errorBody.error
            : `Export request failed (${response.status})`;
        throw new Error(message);
      }

      setPptxStatus("Downloading…");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setPptxStatus("Export failed. Try again.");
      setTimeout(() => setPptxStatus(null), 3000);
      return;
    } finally {
      setExportingPptx(false);
    }

    setPptxStatus(null);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            exportToPDF(
              posts,
              reportTitle,
              `${filenameBase}.pdf`,
              pptxData
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-brand-ink/10 bg-white px-4 py-2 text-sm font-medium text-brand-ink/80 shadow-sm transition hover:bg-brand-off-white"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
        <button
          type="button"
          onClick={() =>
            exportToExcel(posts, `${filenameBase}.xlsx`, reportTitle)
          }
          className="inline-flex items-center gap-2 rounded-lg border border-brand-ink/10 bg-white px-4 py-2 text-sm font-medium text-brand-ink/80 shadow-sm transition hover:bg-brand-off-white"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </button>
        {pptxData && (
          <button
            type="button"
            onClick={() => void handlePowerPointExport()}
            disabled={exportingPptx}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {exportingPptx ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Presentation className="h-4 w-4" />
            )}
            {exportingPptx ? "Exporting…" : "Export PowerPoint"}
          </button>
        )}
      </div>
      {pptxStatus && (
        <p className="text-xs text-brand-muted">{pptxStatus}</p>
      )}
    </div>
  );
}
