import { describe, expect, it } from "vitest";
import { countAboveThreshold, passesConfidenceThreshold } from "./SlideViewer";
import type { SegmentResponse } from "../slides/schema";

function mockSegmentation(
  confidences: Array<number | null | undefined>,
): SegmentResponse {
  return {
    slide_id: "test",
    method: "stardist",
    region: { x: 0, y: 0, width: 100, height: 100 },
    count: confidences.length,
    elapsed_ms: 0,
    nuclei: confidences.map((c, i) => ({
      id: i,
      centroid: [0, 0] as [number, number],
      area: 1,
      bbox: [0, 0, 1, 1] as [number, number, number, number],
      confidence: c,
      polygon: [],
    })),
    confidence: { score: 0.5, label: "medium", reasons: [] },
    warnings: [],
    tissue: { coverage: 1, mean_luminance: 200, is_blank: false },
    provenance: {
      app_version: "test",
      schema_version: "test",
      slide_id: "test",
      region: { x: 0, y: 0, width: 100, height: 100 },
      parameters: {},
    },
  };
}

describe("passesConfidenceThreshold", () => {
  it("keeps every nucleus at threshold 0", () => {
    expect(passesConfidenceThreshold(0.1, 0)).toBe(true);
    expect(passesConfidenceThreshold(null, 0)).toBe(true);
    expect(passesConfidenceThreshold(undefined, 0)).toBe(true);
  });

  it("rejects nuclei below the threshold", () => {
    expect(passesConfidenceThreshold(0.3, 0.5)).toBe(false);
    expect(passesConfidenceThreshold(0.4999, 0.5)).toBe(false);
  });

  it("keeps nuclei at or above the threshold", () => {
    expect(passesConfidenceThreshold(0.5, 0.5)).toBe(true);
    expect(passesConfidenceThreshold(0.9, 0.5)).toBe(true);
  });

  it("keeps nuclei with null or undefined confidence — no signal to filter on", () => {
    expect(passesConfidenceThreshold(null, 0.5)).toBe(true);
    expect(passesConfidenceThreshold(undefined, 0.9)).toBe(true);
  });
});

describe("countAboveThreshold", () => {
  it("returns 0 for null segmentation", () => {
    expect(countAboveThreshold(null, 0.5)).toBe(0);
  });

  it("returns total at threshold 0 without scanning", () => {
    const seg = mockSegmentation([0.1, 0.2, 0.3]);
    expect(countAboveThreshold(seg, 0)).toBe(3);
  });

  it("counts only nuclei at or above the threshold", () => {
    const seg = mockSegmentation([0.1, 0.5, 0.9, 0.49]);
    expect(countAboveThreshold(seg, 0.5)).toBe(2);
  });

  it("counts null-confidence nuclei as kept", () => {
    const seg = mockSegmentation([0.1, null, 0.9]);
    expect(countAboveThreshold(seg, 0.5)).toBe(2);
  });
});
