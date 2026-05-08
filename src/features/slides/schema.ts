import { z } from "zod";

export const dimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const slideMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  format: z.string(),
  dimensions: dimensionsSchema,
  level_count: z.number().int().positive(),
  level_dimensions: z.array(dimensionsSchema),
  tile_size: z.number().int().positive(),
  mpp_x: z.number().nullable().optional(),
  mpp_y: z.number().nullable().optional(),
  objective_power: z.number().nullable().optional(),
  properties: z.record(z.string(), z.string()),
});

export const slideListSchema = z.object({
  slides: z.array(slideMetadataSchema),
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
});

export type SlideMetadata = z.infer<typeof slideMetadataSchema>;
export type SegmentResponse = z.infer<typeof segmentResponseSchema>;
