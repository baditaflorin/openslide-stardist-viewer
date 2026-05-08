import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ExternalLink,
  Heart,
  Microscope,
  Play,
  RefreshCcw,
  Server,
  Star,
} from "lucide-react";

import {
  defaultApiBaseUrl,
  readStoredApiBaseUrl,
  writeStoredApiBaseUrl,
} from "../../api/client";
import { Toast } from "../../ui/Toast";
import { buildInfo } from "../../generated/buildInfo";
import { SlideViewer, type SlideViewerHandle } from "../viewer/SlideViewer";
import type { SegmentResponse } from "./schema";
import { useBackendHealth, useSegmentSlide, useSlides } from "./useSlidesApi";

const SELECTED_SLIDE_KEY = "openslide-stardist-viewer.selectedSlideId";
const MAX_VIEWPORT_PIXELS = 4_194_304;

export function SlideWorkbench() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    typeof window === "undefined"
      ? defaultApiBaseUrl()
      : readStoredApiBaseUrl(),
  );
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(SELECTED_SLIDE_KEY),
  );
  const [segmentation, setSegmentation] = useState<SegmentResponse | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const viewerRef = useRef<SlideViewerHandle | null>(null);

  const healthQuery = useBackendHealth(apiBaseUrl);
  const slidesQuery = useSlides(apiBaseUrl);
  const slides = useMemo(() => slidesQuery.data ?? [], [slidesQuery.data]);
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
    if (selectedSlide) {
      window.localStorage.setItem(SELECTED_SLIDE_KEY, selectedSlide.id);
    }
  }, [selectedSlide]);

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
      const result = await segmentMutation.mutateAsync({
        ...region,
        max_nuclei: 2500,
      });
      setSegmentation(result);
      setToast(`${result.count} nuclei counted.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Segmentation failed.");
    }
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
              <span>{buildInfo.commit}</span>
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
          <div className="slide-list" role="list">
            {slides.map((slide) => (
              <button
                type="button"
                role="listitem"
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

          <div className="summary-block">
            <h2>Cell Count</h2>
            <div className="count-number">{segmentation?.count ?? 0}</div>
            <dl>
              <div>
                <dt>Method</dt>
                <dd>{segmentation?.method ?? "None"}</dd>
              </div>
              <div>
                <dt>Elapsed</dt>
                <dd>
                  {segmentation ? `${segmentation.elapsed_ms} ms` : "0 ms"}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="primary-action"
              onClick={() => void segmentViewport()}
              disabled={!selectedSlide}
            >
              <Play size={16} />
              Segment Viewport
            </button>
          </div>
        </aside>

        <section className="viewer-section" aria-label="Slide viewer">
          <SlideViewer
            ref={viewerRef}
            apiBaseUrl={apiBaseUrl}
            slide={selectedSlide}
            segmentation={segmentation}
          />
        </section>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
