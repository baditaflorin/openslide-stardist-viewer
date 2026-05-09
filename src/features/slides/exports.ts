import type { SegmentResponse } from "./schema";

type AppExportInfo = {
  version: string;
  commit: string;
};

type JsonExportOptions = {
  app: AppExportInfo;
  exportedAt?: string;
};

type CurlOptions = {
  apiBaseUrl: string;
  slideId: string;
  region: SegmentResponse["region"];
  maxNuclei: number;
};

function roundNumber(value: number): number {
  return Number(value.toFixed(6));
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function segmentationToCsv(segmentation: SegmentResponse): string {
  const header = [
    "slide_id",
    "method",
    "region_x",
    "region_y",
    "region_width",
    "region_height",
    "nucleus_id",
    "centroid_x",
    "centroid_y",
    "area",
    "bbox_x",
    "bbox_y",
    "bbox_width",
    "bbox_height",
    "confidence",
  ];
  const rows = [...segmentation.nuclei]
    .sort((left, right) => left.id - right.id)
    .map((nucleus) => [
      segmentation.slide_id,
      segmentation.method,
      segmentation.region.x,
      segmentation.region.y,
      segmentation.region.width,
      segmentation.region.height,
      nucleus.id,
      roundNumber(nucleus.centroid[0]),
      roundNumber(nucleus.centroid[1]),
      roundNumber(nucleus.area),
      roundNumber(nucleus.bbox[0]),
      roundNumber(nucleus.bbox[1]),
      roundNumber(nucleus.bbox[2]),
      roundNumber(nucleus.bbox[3]),
      nucleus.confidence === null || nucleus.confidence === undefined
        ? ""
        : roundNumber(nucleus.confidence),
    ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");
}

export function buildSegmentationJsonExport(
  segmentation: SegmentResponse,
  { app, exportedAt = new Date().toISOString() }: JsonExportOptions,
): string {
  const sortedNuclei = [...segmentation.nuclei].sort(
    (left, right) => left.id - right.id,
  );
  return JSON.stringify(
    {
      schema_version: "segmentation-export/v1",
      exported_at: exportedAt,
      app,
      result: {
        ...segmentation,
        nuclei: sortedNuclei,
      },
    },
    null,
    2,
  );
}

export function buildSegmentationSummary(
  segmentation: SegmentResponse,
): string {
  const tissuePercent = Math.round(segmentation.tissue.coverage * 100);
  const warnings =
    segmentation.warnings.length > 0
      ? ` Warnings: ${segmentation.warnings
          .map((warning) => warning.message)
          .join(" ")}`
      : "";
  return (
    [
      `Slide ${segmentation.slide_id}`,
      `${segmentation.count} nuclei counted`,
      `${segmentation.confidence.label} confidence (${roundNumber(
        segmentation.confidence.score,
      )})`,
      `${segmentation.method} method`,
      `${tissuePercent}% tissue coverage`,
      `region x=${segmentation.region.x}, y=${segmentation.region.y}, width=${segmentation.region.width}, height=${segmentation.region.height}`,
    ].join("; ") + warnings
  );
}

export function buildSegmentationCurlCommand({
  apiBaseUrl,
  slideId,
  region,
  maxNuclei,
}: CurlOptions): string {
  const url = `${apiBaseUrl.replace(/\/+$/, "")}/api/slides/${encodeURIComponent(
    slideId,
  )}/segment`;
  const body = JSON.stringify({
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    max_nuclei: maxNuclei,
  });
  return [
    `curl -X POST '${url}'`,
    "  -H 'Content-Type: application/json'",
    `  --data '${body}'`,
  ].join(" \\\n");
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType: string,
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
