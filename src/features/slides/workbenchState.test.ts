import { describe, expect, it } from "vitest";

import {
  buildWorkbenchState,
  decodeWorkbenchState,
  encodeWorkbenchState,
  parseWorkbenchHash,
  parseWorkbenchStateText,
} from "./workbenchState";

describe("workbench state", () => {
  it("round-trips a versioned state export through hash encoding", () => {
    const state = buildWorkbenchState({
      apiBaseUrl: "http://localhost:25342/",
      selectedSlideId: "demo-1",
      maxNuclei: 500,
      buildInfo: { version: "0.3.0", commit: "abcdef1" },
      exportedAt: "2026-05-10T00:00:00.000Z",
    });

    expect(state.api_base_url).toBe("http://localhost:25342");
    const encoded = encodeWorkbenchState(state);

    expect(decodeWorkbenchState(encoded)).toEqual(state);
    expect(parseWorkbenchHash(`#state=${encoded}`)).toEqual(state);
  });

  it("rejects invalid imported state with user-safe errors", () => {
    expect(() => parseWorkbenchStateText("{")).toThrow(/not valid JSON/);
    expect(() =>
      parseWorkbenchStateText(JSON.stringify({ schema_version: "old" })),
    ).toThrow(/workbench-state\/v1/);
  });
});
