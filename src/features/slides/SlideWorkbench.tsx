import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Clipboard,
  Download,
  ExternalLink,
  FileDown,
  FileUp,
  Heart,
  Link,
  Microscope,
  Play,
  Printer,
  RefreshCcw,
  RotateCcw,
  Server,
  Settings,
  Star,
} from "lucide-react";

import {
  defaultApiBaseUrl,
  readStoredApiBaseUrl,
  writeStoredApiBaseUrl,
} from "../../api/client";
import { Toast } from "../../ui/Toast";
import { buildInfo } from "../../generated/buildInfo";
import {
  SlideViewer,
  countAboveThreshold,
  type SlideViewerHandle,
} from "../viewer/SlideViewer";
import type { SegmentResponse } from "./schema";
import {
  buildSegmentationCurlCommand,
  buildSegmentationJsonExport,
  buildSegmentationSummary,
  downloadTextFile,
  segmentationToCsv,
} from "./exports";
import {
  buildWorkbenchState,
  clearStoredWorkbenchState,
  DEFAULT_MAX_NUCLEI,
  encodeWorkbenchState,
  maxNucleiSchema,
  parseWorkbenchHash,
  parseWorkbenchStateText,
  readStoredMaxNuclei,
  readStoredSelectedSlideId,
  writeStoredMaxNuclei,
  writeStoredSelectedSlideId,
  type WorkbenchStateExport,
} from "./workbenchState";
import {
  useBackendHealth,
  useSegmentSlide,
  useSlides,
  type SegmentRegion,
} from "./useSlidesApi";

const MAX_VIEWPORT_PIXELS = 4_194_304;
type SegmentRequest = Omit<SegmentRegion, "signal">;

function safeFilePart(value: string): string {
  return (
    value
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "slide"
  );
}

function readInitialHashState(): {
  state: WorkbenchStateExport | null;
  error: string | null;
} {
  if (
    typeof window === "undefined" ||
    !window.location.hash.includes("state=")
  ) {
    return { state: null, error: null };
  }
  try {
    return { state: parseWorkbenchHash(window.location.hash), error: null };
  } catch {
    return {
      state: null,
      error:
        "Share link restore failed. The link state is unreadable; reconnect to your backend or import a session JSON file.",
    };
  }
}

export function SlideWorkbench() {
  const initialHashState = useMemo(() => readInitialHashState(), []);
  const restoredState = initialHashState.state;
  const [apiBaseUrl, setApiBaseUrl] = useState(
    () =>
      restoredState?.api_base_url ??
      (typeof window === "undefined"
        ? defaultApiBaseUrl()
        : readStoredApiBaseUrl()),
  );
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    () =>
      restoredState?.selected_slide_id ??
      (typeof window === "undefined" ? null : readStoredSelectedSlideId()),
  );
  const [maxNuclei, setMaxNuclei] = useState(
    () =>
      restoredState?.settings.max_nuclei ??
      (typeof window === "undefined"
        ? DEFAULT_MAX_NUCLEI
        : readStoredMaxNuclei()),
  );
  const [segmentation, setSegmentation] = useState<SegmentResponse | null>(
    null,
  );
  // 0 = show every nucleus (matches the legacy behaviour). The slider
  // ranges 0…1; we don't persist this between sessions because the
  // appropriate threshold depends on the slide and the model the
  // backend used.
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);
  const [lastRegion, setLastRegion] = useState<SegmentRequest | null>(null);
  const [toast, setToast] = useState<string | null>(initialHashState.error);
  const [publishedCommit, setPublishedCommit] = useState<string | null>(null);
  const viewerRef = useRef<SlideViewerHandle | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const debugEnabled = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("debug"),
    [],
  );

  const healthQuery = useBackendHealth(apiBaseUrl);
  const slidesQuery = useSlides(apiBaseUrl);
  const scan = slidesQuery.data;
  const slides = useMemo(() => scan?.slides ?? [], [scan?.slides]);
  const problems = scan?.problems ?? [];
  const summary = scan?.summary ?? null;
  const selectedSlide = useMemo(
    () =>
      slides.find((slide) => slide.id === selectedSlideId) ?? slides[0] ?? null,
    [selectedSlideId, slides],
  );
  const segmentMutation = useSegmentSlide(
    apiBaseUrl,
    selectedSlide?.id ?? null,
  );

  useEffect(() => {
    writeStoredSelectedSlideId(selectedSlide?.id ?? null);
  }, [selectedSlide]);

  useEffect(() => {
    writeStoredMaxNuclei(maxNuclei);
  }, [maxNuclei]);

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
      return;
    }
    const controller = new AbortController();
    fetch(
      "https://api.github.com/repos/baditaflorin/openslide-stardist-viewer/commits/main",
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { sha?: string } | null) => {
        if (payload?.sha) {
          setPublishedCommit(payload.sha.slice(0, 7));
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function saveApiBaseUrl() {
    try {
      const parsed = writeStoredApiBaseUrl(draftApiBaseUrl);
      setApiBaseUrl(parsed);
      setSegmentation(null);
      setToast("Backend URL saved.");
    } catch {
      setToast("Enter a valid backend URL.");
    }
  }

  async function segmentViewport() {
    const region = viewerRef.current?.getViewportRegion();
    if (!region || !selectedSlide) {
      setToast("Select a slide first.");
      return;
    }
    if (region.width * region.height > MAX_VIEWPORT_PIXELS) {
      setToast("Zoom in before segmenting this viewport.");
      return;
    }
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const request = {
        ...region,
        max_nuclei: maxNuclei,
      };
      setLastRegion(request);
      const result = await segmentMutation.mutateAsync({
        ...request,
        signal: controller.signal,
      });
      setSegmentation(result);
      setToast(
        `${result.count} nuclei counted (${result.confidence.label} confidence).`,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setToast("Segmentation cancelled.");
      } else {
        setToast(
          error instanceof Error ? error.message : "Segmentation failed.",
        );
      }
    } finally {
      abortRef.current = null;
    }
  }

  function cancelSegmentation() {
    abortRef.current?.abort();
    abortRef.current = null;
    segmentMutation.reset();
    setToast("Segmentation cancelled.");
  }

  function appExportInfo() {
    return {
      version: buildInfo.version,
      commit: publishedCommit ?? buildInfo.commit,
    };
  }

  function currentWorkbenchState() {
    return buildWorkbenchState({
      apiBaseUrl,
      selectedSlideId: selectedSlide?.id ?? selectedSlideId,
      maxNuclei,
      buildInfo: appExportInfo(),
    });
  }

  async function copyToClipboard(contents: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(contents);
      setToast(successMessage);
    } catch {
      setToast(
        "Copy failed. The browser denied clipboard access; use the matching download action instead.",
      );
    }
  }

  function exportResultJson() {
    if (!segmentation) {
      setToast("JSON export failed. Segment a viewport first, then export.");
      return;
    }
    downloadTextFile(
      `segmentation-${safeFilePart(segmentation.slide_id)}.json`,
      buildSegmentationJsonExport(segmentation, { app: appExportInfo() }),
      "application/json",
    );
    setToast("Segmentation JSON exported.");
  }

  function exportResultCsv() {
    if (!segmentation) {
      setToast("CSV export failed. Segment a viewport first, then export.");
      return;
    }
    downloadTextFile(
      `nuclei-${safeFilePart(segmentation.slide_id)}.csv`,
      segmentationToCsv(segmentation),
      "text/csv",
    );
    setToast("Nuclei CSV exported.");
  }

  function exportSessionState() {
    downloadTextFile(
      "openslide-stardist-session.json",
      JSON.stringify(currentWorkbenchState(), null, 2),
      "application/json",
    );
    setToast("Session state exported.");
  }

  async function importSessionState(file: File) {
    try {
      const state = parseWorkbenchStateText(await file.text());
      const parsedMaxNuclei = maxNucleiSchema.parse(state.settings.max_nuclei);
      const parsedApiBaseUrl = writeStoredApiBaseUrl(state.api_base_url);
      writeStoredSelectedSlideId(state.selected_slide_id);
      writeStoredMaxNuclei(parsedMaxNuclei);
      setApiBaseUrl(parsedApiBaseUrl);
      setDraftApiBaseUrl(parsedApiBaseUrl);
      setSelectedSlideId(state.selected_slide_id);
      setMaxNuclei(parsedMaxNuclei);
      setSegmentation(null);
      setLastRegion(null);
      setToast("Session imported. Slide list and settings restored.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Session import failed. Choose a session JSON file exported from this app.",
      );
    }
  }

  async function handleSessionFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (file) {
      await importSessionState(file);
    }
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    url.hash = `state=${encodeWorkbenchState(currentWorkbenchState())}`;
    await copyToClipboard(
      url.toString(),
      "Share link copied. It restores backend URL, selected slide, and settings.",
    );
  }

  async function copyResultSummary() {
    if (!segmentation) {
      setToast("Summary copy failed. Segment a viewport first, then copy.");
      return;
    }
    await copyToClipboard(
      buildSegmentationSummary(segmentation),
      "Segmentation summary copied.",
    );
  }

  async function copyCurlCommand() {
    if (!segmentation || !lastRegion) {
      setToast("curl copy failed. Segment a viewport first, then copy.");
      return;
    }
    await copyToClipboard(
      buildSegmentationCurlCommand({
        apiBaseUrl,
        slideId: segmentation.slide_id,
        region: segmentation.region,
        maxNuclei: lastRegion.max_nuclei,
      }),
      "curl command copied.",
    );
  }

  function printReport() {
    window.print();
    setToast("Print dialog opened.");
  }

  function startFresh() {
    clearStoredWorkbenchState();
    const fallbackApiBaseUrl = defaultApiBaseUrl();
    setApiBaseUrl(fallbackApiBaseUrl);
    setDraftApiBaseUrl(fallbackApiBaseUrl);
    setSelectedSlideId(null);
    setMaxNuclei(DEFAULT_MAX_NUCLEI);
    setSegmentation(null);
    setLastRegion(null);
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    setToast("Workbench reset. Reconnect to your backend when ready.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-icon" aria-hidden="true">
            <Microscope size={22} />
          </div>
          <div>
            <h1>OpenSlide StarDist Viewer</h1>
            <div className="build-line">
              <span>v{buildInfo.version}</span>
              <span>{publishedCommit ?? buildInfo.commit}</span>
            </div>
          </div>
        </div>
        <nav className="top-actions" aria-label="Project links">
          <a
            href={buildInfo.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="icon-link"
          >
            <Star size={18} />
            <span>Star</span>
            <ExternalLink size={14} />
          </a>
          <a
            href={buildInfo.paypalUrl}
            target="_blank"
            rel="noreferrer"
            className="icon-link accent"
          >
            <Heart size={18} />
            <span>PayPal</span>
            <ExternalLink size={14} />
          </a>
        </nav>
      </header>

      <section className="connection-strip" aria-label="Backend connection">
        <Server size={18} />
        <label htmlFor="apiBaseUrl">Backend URL</label>
        <input
          id="apiBaseUrl"
          value={draftApiBaseUrl}
          onChange={(event) => setDraftApiBaseUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              saveApiBaseUrl();
            }
          }}
        />
        <button type="button" onClick={saveApiBaseUrl}>
          <RefreshCcw size={16} />
          Connect
        </button>
        <span
          className={healthQuery.isSuccess ? "status-pill ok" : "status-pill"}
        >
          <Activity size={14} />
          {healthQuery.isSuccess
            ? "Ready"
            : healthQuery.isFetching
              ? "Checking"
              : "Offline"}
        </span>
      </section>

      <div className="workspace">
        <aside className="slide-panel">
          <div className="panel-heading">
            <h2>Slides</h2>
            <button
              type="button"
              onClick={() => void slidesQuery.refetch()}
              aria-label="Refresh slide list"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
          {summary ? (
            <p className="panel-note">
              {summary.usable_slides} usable · {summary.problem_files} issue ·{" "}
              {summary.duration_ms} ms
            </p>
          ) : null}
          <div className="slide-list">
            {slides.map((slide) => (
              <button
                type="button"
                className={
                  slide.id === selectedSlide?.id
                    ? "slide-row active"
                    : "slide-row"
                }
                key={slide.id}
                onClick={() => {
                  setSelectedSlideId(slide.id);
                  setSegmentation(null);
                }}
              >
                <span>{slide.name}</span>
                <small>
                  {slide.inferences.vendor} · {slide.inferences.modality} ·{" "}
                  {slide.dimensions.width.toLocaleString()} x{" "}
                  {slide.dimensions.height.toLocaleString()}
                </small>
              </button>
            ))}
            {slidesQuery.isError ? (
              <p className="panel-note">{String(slidesQuery.error.message)}</p>
            ) : null}
            {!slidesQuery.isLoading && slides.length === 0 ? (
              <p className="panel-note">No slides found.</p>
            ) : null}
          </div>

          {problems.length > 0 ? (
            <div className="scan-issues">
              <h2>Scan Issues</h2>
              {problems.slice(0, 5).map((problem) => (
                <article
                  key={problem.id}
                  className={`issue-row ${problem.severity}`}
                >
                  <strong>{problem.filename}</strong>
                  <span>{problem.message}</span>
                  <small>{problem.next_step}</small>
                </article>
              ))}
            </div>
          ) : null}

          <div className="settings-block">
            <h2>Settings</h2>
            <label htmlFor="maxNuclei">
              <Settings size={14} />
              Max nuclei
            </label>
            <input
              id="maxNuclei"
              type="number"
              min={1}
              max={10_000}
              step={1}
              value={maxNuclei}
              onChange={(event) =>
                setMaxNuclei(maxNucleiSchema.parse(event.target.value))
              }
            />
            <label htmlFor="confidenceThreshold">
              <Settings size={14} />
              Confidence threshold ({Math.round(confidenceThreshold * 100)}%)
            </label>
            <input
              id="confidenceThreshold"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={confidenceThreshold}
              onChange={(event) =>
                setConfidenceThreshold(Number(event.target.value))
              }
              aria-describedby="confidenceThresholdHelp"
            />
            <small id="confidenceThresholdHelp">
              Nuclei below the threshold render dimmed (≈25% alpha) and drop out
              of the "kept" count below. Nuclei without a confidence score stay
              visible — there's no signal to filter on.
            </small>
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleSessionFileChange(event)}
            />
            <div className="session-actions" aria-label="Session actions">
              <button type="button" onClick={exportSessionState}>
                <FileDown size={15} />
                Save Session
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
              >
                <FileUp size={15} />
                Import Session
              </button>
              <button type="button" onClick={() => void copyShareLink()}>
                <Link size={15} />
                Share Link
              </button>
              <button type="button" onClick={startFresh}>
                <RotateCcw size={15} />
                Start Fresh
              </button>
            </div>
          </div>

          <div className="summary-block">
            <h2>Cell Count</h2>
            <div className="count-number">
              {confidenceThreshold > 0 && segmentation
                ? `${countAboveThreshold(segmentation, confidenceThreshold)} / ${segmentation.count}`
                : (segmentation?.count ?? 0)}
            </div>
            <dl>
              <div>
                <dt>Method</dt>
                <dd>{segmentation?.method ?? "None"}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{segmentation?.confidence.label ?? "None"}</dd>
              </div>
              <div>
                <dt>Tissue</dt>
                <dd>
                  {segmentation
                    ? `${Math.round(segmentation.tissue.coverage * 100)}%`
                    : "0%"}
                </dd>
              </div>
              <div>
                <dt>Elapsed</dt>
                <dd>
                  {segmentation ? `${segmentation.elapsed_ms} ms` : "0 ms"}
                </dd>
              </div>
            </dl>
            {segmentation?.warnings.length ? (
              <div className="result-warnings">
                {segmentation.warnings.map((warning) => (
                  <p key={warning.code}>{warning.message}</p>
                ))}
              </div>
            ) : null}
            <div className="output-actions" aria-label="Result exports">
              <button
                type="button"
                onClick={exportResultJson}
                disabled={!segmentation}
              >
                <Download size={15} />
                Export JSON
              </button>
              <button
                type="button"
                onClick={exportResultCsv}
                disabled={!segmentation}
              >
                <Download size={15} />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void copyResultSummary()}
                disabled={!segmentation}
              >
                <Clipboard size={15} />
                Copy Summary
              </button>
              <button
                type="button"
                onClick={() => void copyCurlCommand()}
                disabled={!segmentation}
              >
                <Clipboard size={15} />
                Copy curl
              </button>
              <button
                type="button"
                onClick={printReport}
                disabled={!segmentation}
              >
                <Printer size={15} />
                Print
              </button>
            </div>
            {segmentMutation.isPending ? (
              <button
                type="button"
                className="primary-action secondary"
                onClick={cancelSegmentation}
              >
                <RefreshCcw size={16} />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="primary-action"
                onClick={() => void segmentViewport()}
                disabled={!selectedSlide}
              >
                <Play size={16} />
                Segment Viewport
              </button>
            )}
          </div>
        </aside>

        <section className="viewer-section" aria-label="Slide viewer">
          <SlideViewer
            ref={viewerRef}
            apiBaseUrl={apiBaseUrl}
            slide={selectedSlide}
            segmentation={segmentation}
            confidenceThreshold={confidenceThreshold}
          />
          {debugEnabled ? (
            <aside className="debug-panel" aria-label="Debug diagnostics">
              <pre>{JSON.stringify({ scan, segmentation }, null, 2)}</pre>
            </aside>
          ) : null}
        </section>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
