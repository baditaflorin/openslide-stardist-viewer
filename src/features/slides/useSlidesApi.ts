import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiErrorMessage, makeApiClient } from "../../api/client";
import {
  segmentResponseSchema,
  slideListSchema,
  type SegmentResponse,
} from "./schema";

export type SegmentRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  max_nuclei: number;
  signal?: AbortSignal;
};

export function useSlidesApi(apiBaseUrl: string) {
  return useMemo(() => makeApiClient(apiBaseUrl), [apiBaseUrl]);
}

export function useBackendHealth(apiBaseUrl: string) {
  const client = useSlidesApi(apiBaseUrl);
  return useQuery({
    queryKey: ["health", apiBaseUrl],
    queryFn: async () => {
      const { data, error } = await client.GET("/healthz");
      if (error) {
        throw new Error(apiErrorMessage(error));
      }
      return data;
    },
  });
}

export function useSlides(apiBaseUrl: string) {
  const client = useSlidesApi(apiBaseUrl);
  return useQuery({
    queryKey: ["slides", apiBaseUrl],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/slides");
      if (error) {
        throw new Error(apiErrorMessage(error));
      }
      return slideListSchema.parse(data);
    },
  });
}

export function useSegmentSlide(apiBaseUrl: string, slideId: string | null) {
  const client = useSlidesApi(apiBaseUrl);
  return useMutation({
    mutationFn: async ({
      signal,
      ...region
    }: SegmentRegion): Promise<SegmentResponse> => {
      if (!slideId) {
        throw new Error("No slide selected.");
      }
      const options = {
        params: { path: { slide_id: slideId } },
        body: region,
        signal,
      } as Parameters<typeof client.POST>[1];
      const { data, error } = await client.POST(
        "/api/slides/{slide_id}/segment",
        options,
      );
      if (error) {
        throw new Error(apiErrorMessage(error));
      }
      return segmentResponseSchema.parse(data);
    },
  });
}
