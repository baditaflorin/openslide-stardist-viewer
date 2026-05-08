import createClient from "openapi-fetch";
import { z } from "zod";

import type { paths } from "./schema";

const API_BASE_STORAGE_KEY = "openslide-stardist-viewer.apiBaseUrl";

export const apiBaseUrlSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => value.replace(/\/+$/, ""));

export function defaultApiBaseUrl(): string {
  return apiBaseUrlSchema
    .catch("http://localhost:25342")
    .parse(import.meta.env.VITE_API_BASE_URL);
}

export function readStoredApiBaseUrl(): string {
  const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  return apiBaseUrlSchema
    .catch(defaultApiBaseUrl())
    .parse(stored ?? defaultApiBaseUrl());
}

export function writeStoredApiBaseUrl(value: string): string {
  const parsed = apiBaseUrlSchema.parse(value);
  window.localStorage.setItem(API_BASE_STORAGE_KEY, parsed);
  return parsed;
}

export function makeApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

export function apiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "error" in error) {
    const apiError = error.error as { message?: string };
    if (apiError.message) {
      return apiError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed.";
}
