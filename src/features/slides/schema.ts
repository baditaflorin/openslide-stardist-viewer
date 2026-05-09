import { z } from "zod";

export const dimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const domainWarningSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string(),
  next_step: z.string().nullable().optional(),
});

export const slideInferencesSchema = z.object({
  vendor: z.string(),
  modality: z.enum(["brightfield", "fluorescence", "unknown"]),
  stain: z.string().nullable().optional(),
  mpp_available: z.boolean(),
  objective_available: z.boolean(),
  sidecar_required: z.boolean(),
  sidecar_ok: z.boolean().nullable().optional(),
  huge_slide: z.boolean(),
  sparse_risk: z.boolean(),
  segmentation_suitable: z.boolean(),
  confidence: z.number(),
  reasons: z.array(z.string()),
});

export const slideMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  relative_path: z.string(),
  format: z.string(),
  fingerprint: z.string(),
  size_bytes: z.number().int().nonnegative(),
  dimensions: dimensionsSchema,
  level_count: z.number().int().positive(),
  level_dimensions: z.array(dimensionsSchema),
  tile_size: z.number().int().positive(),
  mpp_x: z.number().nullable().optional(),
  mpp_y: z.number().nullable().optional(),
  objective_power: z.number().nullable().optional(),
  properties: z.record(z.string(), z.string()),
  inferences: slideInferencesSchema,
  warnings: z.array(domainWarningSchema),
});

export const slideProblemSchema = z.object({
  id: z.string(),
  filename: z.string(),
  relative_path: z.string(),
  extension: z.string(),
  size_bytes: z.number().int().nonnegative(),
  category: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string(),
  next_step: z.string(),
});

export const scanSummarySchema = z.object({
  total_files: z.number().int().nonnegative(),
  usable_slides: z.number().int().nonnegative(),
  problem_files: z.number().int().nonnegative(),
  ignored_sidecars: z.number().int().nonnegative(),
  duration_ms: z.number(),
  warnings: z.array(domainWarningSchema),
});

export const slideListSchema = z.object({
  slides: z.array(slideMetadataSchema),
  problems: z.array(slideProblemSchema),
  summary: scanSummarySchema,
});

export const nucleusSchema = z.object({
  id: z.number().int(),
  centroid: z.tuple([z.number(), z.number()]),
  area: z.number(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  confidence: z.number().nullable().optional(),
  polygon: z.array(z.tuple([z.number(), z.number()])),
});

export const segmentResponseSchema = z.object({
  slide_id: z.string(),
  method: z.string(),
  region: z.object({
    x: z.number().int(),
    y: z.number().int(),
    width: z.number().int(),
    height: z.number().int(),
  }),
  count: z.number().int(),
  elapsed_ms: z.number(),
  nuclei: z.array(nucleusSchema),
  confidence: z.object({
    score: z.number(),
    label: z.string(),
    reasons: z.array(z.string()),
  }),
  warnings: z.array(
    z.object({
      code: z.string(),
      severity: z.string(),
      message: z.string(),
      next_step: z.string().nullable().optional(),
    }),
  ),
  tissue: z.object({
    coverage: z.number(),
    mean_luminance: z.number(),
    is_blank: z.boolean(),
  }),
  provenance: z.object({
    app_version: z.string(),
    schema_version: z.string(),
    slide_id: z.string(),
    region: z.object({
      x: z.number().int(),
      y: z.number().int(),
      width: z.number().int(),
      height: z.number().int(),
    }),
    parameters: z.record(z.string(), z.union([z.string(), z.number()])),
  }),
});

export type SlideMetadata = z.infer<typeof slideMetadataSchema>;
export type SlideList = z.infer<typeof slideListSchema>;
export type SegmentResponse = z.infer<typeof segmentResponseSchema>;
