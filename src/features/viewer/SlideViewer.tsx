import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import OpenSeadragon from "openseadragon";

import type { SegmentResponse, SlideMetadata } from "../slides/schema";

export type ViewportRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SlideViewerHandle = {
  getViewportRegion: () => ViewportRegion | null;
};

type Props = {
  apiBaseUrl: string;
  slide: SlideMetadata | null;
  segmentation: SegmentResponse | null;
  /**
   * Minimum nucleus confidence required to render at full opacity. Nuclei
   * below the threshold render at ~25% alpha so the user can still see them
   * fade out as the slider moves. Nuclei with null confidence are treated
   * as if they came in just above the threshold — they're shown but not
   * counted in the "kept" total. Defaults to 0 (everything visible).
   */
  confidenceThreshold?: number;
};

export const SlideViewer = forwardRef<SlideViewerHandle, Props>(
  function SlideViewer(
    { apiBaseUrl, slide, segmentation, confidenceThreshold = 0 },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
    const segmentationRef = useRef<SegmentResponse | null>(segmentation);
    const thresholdRef = useRef<number>(confidenceThreshold);

    const tileSource = useMemo(() => {
      if (!slide) {
        return null;
      }
      const maxLevel = Math.ceil(
        Math.log2(Math.max(slide.dimensions.width, slide.dimensions.height)),
      );
      return {
        width: slide.dimensions.width,
        height: slide.dimensions.height,
        tileSize: slide.tile_size,
        minLevel: 0,
        maxLevel,
        getTileUrl(level: number, x: number, y: number) {
          return `${apiBaseUrl}/api/slides/${slide.id}_files/${level}/${x}_${y}.jpeg`;
        },
      };
    }, [apiBaseUrl, slide]);

    useImperativeHandle(ref, () => ({
      getViewportRegion() {
        const viewer = viewerRef.current;
        if (!viewer || !slide) {
          return null;
        }
        const bounds = viewer.viewport.getBounds(true);
        const topLeft = viewer.viewport.viewportToImageCoordinates(
          bounds.x,
          bounds.y,
        );
        const bottomRight = viewer.viewport.viewportToImageCoordinates(
          bounds.x + bounds.width,
          bounds.y + bounds.height,
        );
        const x = Math.max(0, Math.floor(topLeft.x));
        const y = Math.max(0, Math.floor(topLeft.y));
        const width = Math.min(
          slide.dimensions.width - x,
          Math.ceil(bottomRight.x - topLeft.x),
        );
        const height = Math.min(
          slide.dimensions.height - y,
          Math.ceil(bottomRight.y - topLeft.y),
        );
        return { x, y, width: Math.max(1, width), height: Math.max(1, height) };
      },
    }));

    useEffect(() => {
      if (!containerRef.current || !tileSource || !slide) {
        return;
      }
      const viewer = OpenSeadragon({
        element: containerRef.current,
        showNavigationControl: true,
        showNavigator: true,
        navigatorPosition: "BOTTOM_RIGHT",
        animationTime: 0.18,
        blendTime: 0.08,
        constrainDuringPan: true,
        visibilityRatio: 0.65,
        maxZoomPixelRatio: 3,
        gestureSettingsMouse: {
          clickToZoom: false,
        },
        tileSources: tileSource,
      });
      viewerRef.current = viewer;
      const redraw = () =>
        drawSegmentationOverlay(
          viewer,
          overlayRef.current,
          segmentationRef.current,
          thresholdRef.current,
        );
      viewer.addHandler("open", redraw);
      viewer.addHandler("animation", redraw);
      viewer.addHandler("resize", redraw);
      return () => {
        viewer.destroy();
        viewerRef.current = null;
      };
    }, [slide, tileSource]);

    useEffect(() => {
      segmentationRef.current = segmentation;
      thresholdRef.current = confidenceThreshold;
      if (viewerRef.current) {
        drawSegmentationOverlay(
          viewerRef.current,
          overlayRef.current,
          segmentation,
          confidenceThreshold,
        );
      }
    }, [segmentation, confidenceThreshold]);

    if (!slide) {
      return (
        <div className="viewer-empty">
          <img
            src={`${import.meta.env.BASE_URL}sample-micrograph.png`}
            alt=""
          />
        </div>
      );
    }

    return (
      <div className="viewer-frame">
        <div
          ref={containerRef}
          className="viewer-canvas"
          aria-label={`${slide.name} whole-slide image viewer`}
        />
        <canvas
          ref={overlayRef}
          className="segmentation-overlay"
          aria-hidden="true"
        />
      </div>
    );
  },
);

/**
 * Returns true when a nucleus should render at full opacity given the
 * current confidence threshold. Nuclei with `null` / `undefined`
 * confidence (e.g. legacy responses or backends that don't surface a
 * per-nucleus score) are kept — there's no signal to filter on.
 */
export function passesConfidenceThreshold(
  confidence: number | null | undefined,
  threshold: number,
): boolean {
  if (threshold <= 0) return true;
  if (confidence === null || confidence === undefined) return true;
  return confidence >= threshold;
}

/**
 * Count nuclei that pass the threshold. Surfaced so the UI can show
 * "412 of 537 kept" without re-implementing the rule.
 */
export function countAboveThreshold(
  segmentation: SegmentResponse | null,
  threshold: number,
): number {
  if (!segmentation) return 0;
  if (threshold <= 0) return segmentation.nuclei.length;
  let kept = 0;
  for (const nucleus of segmentation.nuclei) {
    if (passesConfidenceThreshold(nucleus.confidence, threshold)) {
      kept += 1;
    }
  }
  return kept;
}

function drawSegmentationOverlay(
  viewer: OpenSeadragon.Viewer,
  canvas: HTMLCanvasElement | null,
  segmentation: SegmentResponse | null,
  confidenceThreshold: number,
) {
  if (!canvas || !segmentation || !viewer.viewport) {
    if (canvas) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }
  const rect = viewer.container.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, rect.width, rect.height);
  context.lineWidth = 1.5;

  for (const nucleus of segmentation.nuclei) {
    const keep = passesConfidenceThreshold(
      nucleus.confidence,
      confidenceThreshold,
    );
    // Below-threshold nuclei stay visible at ~25% alpha so the user can
    // see them fade as the slider moves rather than disappearing
    // abruptly — important for picking a defensible threshold.
    context.globalAlpha = keep ? 1 : 0.25;
    context.strokeStyle = "rgba(41, 204, 151, 0.9)";
    context.fillStyle = "rgba(255, 219, 102, 0.9)";

    const [x1, y1, x2, y2] = nucleus.bbox;
    const topLeft = viewer.viewport.imageToViewerElementCoordinates(
      new OpenSeadragon.Point(x1, y1),
    );
    const bottomRight = viewer.viewport.imageToViewerElementCoordinates(
      new OpenSeadragon.Point(x2, y2),
    );
    const centroid = viewer.viewport.imageToViewerElementCoordinates(
      new OpenSeadragon.Point(nucleus.centroid[0], nucleus.centroid[1]),
    );
    context.strokeRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y,
    );
    context.beginPath();
    context.arc(centroid.x, centroid.y, 2.6, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}
