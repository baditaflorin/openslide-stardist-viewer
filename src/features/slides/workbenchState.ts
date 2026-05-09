import { z } from "zod";

import { API_BASE_STORAGE_KEY, apiBaseUrlSchema } from "../../api/client";

export const SELECTED_SLIDE_STORAGE_KEY =
  "openslide-stardist-viewer.selectedSlideId";
export const MAX_NUCLEI_STORAGE_KEY = "openslide-stardist-viewer.maxNuclei";
export const DEFAULT_MAX_NUCLEI = 2500;

export const maxNucleiSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(10_000)
  .catch(DEFAULT_MAX_NUCLEI);

export const workbenchStateSchema = z.object({
  schema_version: z.literal("workbench-state/v1"),
  exported_at: z.string().datetime(),
  app: z.object({
    version: z.string(),
    commit: z.string(),
  }),
  api_base_url: apiBaseUrlSchema,
  selected_slide_id: z.string().min(1).nullable(),
  settings: z.object({
    max_nuclei: maxNucleiSchema,
  }),
});

export type WorkbenchStateExport = z.infer<typeof workbenchStateSchema>;

type BuildInfo = {
  version: string;
  commit: string;
};

type WorkbenchStateInput = {
  apiBaseUrl: string;
  selectedSlideId: string | null;
  maxNuclei: number;
  buildInfo: BuildInfo;
  exportedAt?: string;
};

export function readStoredSelectedSlideId(): string | null {
  const stored = window.localStorage.getItem(SELECTED_SLIDE_STORAGE_KEY);
  return stored && stored.trim().length > 0 ? stored : null;
}

export function writeStoredSelectedSlideId(slideId: string | null): void {
  if (slideId) {
    window.localStorage.setItem(SELECTED_SLIDE_STORAGE_KEY, slideId);
    return;
  }
  window.localStorage.removeItem(SELECTED_SLIDE_STORAGE_KEY);
}

export function readStoredMaxNuclei(): number {
  return maxNucleiSchema.parse(
    window.localStorage.getItem(MAX_NUCLEI_STORAGE_KEY),
  );
}

export function writeStoredMaxNuclei(maxNuclei: number): number {
  const parsed = maxNucleiSchema.parse(maxNuclei);
  window.localStorage.setItem(MAX_NUCLEI_STORAGE_KEY, String(parsed));
  return parsed;
}

export function clearStoredWorkbenchState(): void {
  window.localStorage.removeItem(API_BASE_STORAGE_KEY);
  window.localStorage.removeItem(SELECTED_SLIDE_STORAGE_KEY);
  window.localStorage.removeItem(MAX_NUCLEI_STORAGE_KEY);
}

export function buildWorkbenchState({
  apiBaseUrl,
  selectedSlideId,
  maxNuclei,
  buildInfo,
  exportedAt = new Date().toISOString(),
}: WorkbenchStateInput): WorkbenchStateExport {
  return workbenchStateSchema.parse({
    schema_version: "workbench-state/v1",
    exported_at: exportedAt,
    app: {
      version: buildInfo.version,
      commit: buildInfo.commit,
    },
    api_base_url: apiBaseUrl,
    selected_slide_id: selectedSlideId,
    settings: {
      max_nuclei: maxNuclei,
    },
  });
}

export function parseWorkbenchState(input: unknown): WorkbenchStateExport {
  return workbenchStateSchema.parse(input);
}

export function parseWorkbenchStateText(text: string): WorkbenchStateExport {
  try {
    return parseWorkbenchState(JSON.parse(text));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        "Session import failed. The JSON shape does not match a workbench-state/v1 export; choose a session file exported from this app.",
        { cause: error },
      );
    }
    throw new Error(
      "Session import failed. The file is not valid JSON; choose a session file exported from this app.",
      { cause: error },
    );
  }
}

export function encodeWorkbenchState(state: WorkbenchStateExport): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeWorkbenchState(encoded: string): WorkbenchStateExport {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const text = new TextDecoder().decode(bytes);
  return parseWorkbenchStateText(text);
}

export function parseWorkbenchHash(hash: string): WorkbenchStateExport | null {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(trimmed);
  const encoded = params.get("state");
  return encoded ? decodeWorkbenchState(encoded) : null;
}
