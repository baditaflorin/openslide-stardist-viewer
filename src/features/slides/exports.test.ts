import { describe, expect, it } from "vitest";

import type { SegmentResponse } from "./schema";
import {
  buildSegmentationCurlCommand,
  buildSegmentationJsonExport,
  buildSegmentationSummary,
  segmentationToCsv,
} from "./exports";

const segmentation: SegmentResponse = {
  slide_id: "demo slide",
  method: "fallback",
  region: { x: 10, y: 20, width: 300, height: 200 },
  count: 2,
  elapsed_ms: 42,
  nuclei: [
    {
      id: 2,
      centroid: [3.1234567, 4],
      area: 12.5,
      bbox: [1, 2, 3, 4],
      confidence: 0.7,
      polygon: [
        [1, 2],
        [3, 4],
      ],
    },
    {
      id: 1,
      centroid: [1, 2],
      area: 10,
      bbox: [5, 6, 7, 8],
      confidence: null,
      polygon: [
        [5, 6],
        [7, 8],
      ],
    },
  ],
  confidence: {
    score: 0.83,
    label: "high",
    reasons: ["fallback fixture"],
  },
  warnings: [],
  tissue: {
    coverage: 0.42,
    mean_luminance: 180,
    is_blank: false,
  },
  provenance: {
    app_version: "0.3.0",
    schema_version: "segmentation/v1",
    slide_id: "demo slide",
    region: { x: 10, y: 20, width: 300, height: 200 },
    parameters: { max_nuclei: 2500 },
  },
};

describe("segmentation exports", () => {
  it("exports deterministic CSV with stable nucleus ordering", () => {
    expect(segmentationToCsv(segmentation)).toMatchInlineSnapshot(`
      "slide_id,method,region_x,region_y,region_width,region_height,nucleus_id,centroid_x,centroid_y,area,bbox_x,bbox_y,bbox_width,bbox_height,confidence
      demo slide,fallback,10,20,300,200,1,1,2,10,5,6,7,8,
      demo slide,fallback,10,20,300,200,2,3.123457,4,12.5,1,2,3,4,0.7"
    `);
  });

  it("exports deterministic JSON when exported time is fixed", () => {
    const json = buildSegmentationJsonExport(segmentation, {
      app: { version: "0.3.0", commit: "abcdef1" },
      exportedAt: "2026-05-10T00:00:00.000Z",
    });

    expect(json).toContain('"schema_version": "segmentation-export/v1"');
    expect(json.indexOf('"id": 1')).toBeLessThan(json.indexOf('"id": 2'));
    expect(JSON.parse(json)).toMatchObject({
      exported_at: "2026-05-10T00:00:00.000Z",
      app: { version: "0.3.0", commit: "abcdef1" },
      result: { count: 2 },
    });
  });

  it("builds copyable summary and curl command", () => {
    expect(buildSegmentationSummary(segmentation)).toContain(
      "2 nuclei counted",
    );
    expect(
      buildSegmentationCurlCommand({
        apiBaseUrl: "http://localhost:25342/",
        slideId: "demo slide",
        region: segmentation.region,
        maxNuclei: 2500,
      }),
    ).toContain("/api/slides/demo%20slide/segment");
  });
});
