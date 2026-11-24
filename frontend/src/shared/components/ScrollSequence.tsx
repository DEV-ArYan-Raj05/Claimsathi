/**
 * ScrollSequence — Apple-style scroll-linked image sequence on a <canvas>.
 *
 * Used on x-01 (track home): the tractor for Crop, the MRI machine for Health. Frames live in
 * /public/<dir>/frame-001.webp … frame-NNN.webp; which folder a track uses is data in
 * shared/config/tracks.ts, so this component never knows which track it is on.
 *
 * ── Scroll → frame mapping (tune the speed here) ─────────────────────────────────────────────
 *   progress   = how far the user has scrolled through the tall container, 0 → 1
 *              = (stickyTop - containerTop) / (containerHeight - pinnedCanvasHeight)
 *   frameIndex = round(progress × (framesLoaded − 1))
 * So the whole sequence plays across (SCROLL_LENGTH_VH − 100)vh of scrolling. Taller container =
 * more scrolling per frame = slower animation; shorter = faster. Nothing else needs changing.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { isLowMemoryDevice, useReducedMotion } from "../hooks/useReducedMotion";
import { useMediaQuery } from "../hooks/useMediaQuery";

/** Height of the scroll track. 400vh = 300vh of travel for the full sequence. */
const SCROLL_LENGTH_VH = 400;
/** Under this width we load every second frame (half the data on mobile/3G). */
const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_FRAME_STEP = 2;
/** Cap device-pixel-ratio so 3× phones don't allocate huge canvases. */
const MAX_DPR = 2;

export interface SequenceCaption {
  /** Progress (0–1) at which this caption appears; it stays until the next one. */
  at: number;
  title: string;
  body: string;
}

interface ScrollSequenceProps {
  dir: string;
  frameCount: number;
  label: string;
  captions?: readonly SequenceCaption[];
  /** Height of any sticky header above, so the canvas pins just below it (CSS length). */
  topOffset?: string;
  children?: ReactNode;
}

const frameUrl = (dir: string, n: number) => `${dir}/frame-${String(n).padStart(3, "0")}.webp`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // a missing frame is skipped, not fatal
    img.src = src;
  });
}

/** Draw `img` centred with "contain" fit; fill letterbox with the frame's own paper colour. */
function paint(canvas: HTMLCanvasElement, img: HTMLImageElement, paper: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}

/** Sample the top-left pixel so the letterbox matches the drawing's paper (no hex in code). */
function samplePaper(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return "transparent";
  ctx.drawImage(img, 2, 2, 1, 1, 0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r} ${g} ${b})`;
}

export function ScrollSequence({
  dir,
  frameCount,
  label,
  captions = [],
  topOffset = "0px",
  children,
}: ScrollSequenceProps) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
  const isStatic = prefersReduced || isLowMemoryDevice();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [caption, setCaption] = useState(0);
  // Captions are read through a ref so a new array from the parent doesn't reload every frame.
  const captionsRef = useRef(captions);
  captionsRef.current = captions;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let cancelled = false;
    let rafId = 0;
    let frames: HTMLImageElement[] = [];
    let paper = "transparent";
    let drawnIndex = -1; // last painted frame — we only repaint when this changes
    let captionIndex = -1;

    // Which frame numbers to fetch: reduced motion → one static frame (the fully exploded view);
    // mobile → every second frame; otherwise all of them.
    const step = isMobile ? MOBILE_FRAME_STEP : 1;
    const numbers = isStatic
      ? [frameCount]
      : Array.from({ length: Math.ceil(frameCount / step) }, (_, i) => 1 + i * step);
    setTotal(numbers.length);
    setLoaded(0);
    setIsReady(false);

    const resize = () => {
      // Backing store matches the CSS box × DPR; paint() keeps the image's aspect ratio.
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      drawnIndex = -1; // force a repaint at the new size
    };

    const progress = () => {
      const rect = container.getBoundingClientRect();
      // stickyTop = where the canvas pins (below any header); pinned = its on-screen height.
      const sticky = canvas.parentElement;
      const stickyTop = sticky ? parseFloat(getComputedStyle(sticky).top) || 0 : 0;
      const pinned = canvas.getBoundingClientRect().height;
      const travel = rect.height - pinned;
      return travel <= 0 ? 1 : Math.min(1, Math.max(0, (stickyTop - rect.top) / travel));
    };

    const tick = () => {
      // Runs once per animation frame; reads scroll position, never reacts to scroll events.
      const p = isStatic ? 1 : progress();
      const index = Math.round(p * (frames.length - 1));
      const img = frames[index];
      if (index !== drawnIndex && img) {
        paint(canvas, img, paper);
        drawnIndex = index;
      }
      const nextCaption = captionsRef.current.reduce((acc, c, i) => (p >= c.at ? i : acc), 0);
      if (nextCaption !== captionIndex) {
        captionIndex = nextCaption;
        setCaption(nextCaption);
      }
      if (!isStatic) rafId = requestAnimationFrame(tick);
    };

    void (async () => {
      let count = 0;
      const results = await Promise.all(
        numbers.map((n) =>
          loadImage(frameUrl(dir, n)).then((img) => {
            if (!cancelled) setLoaded(++count);
            return img;
          }),
        ),
      );
      if (cancelled) return;
      frames = results.filter((img): img is HTMLImageElement => img !== null);
      if (!frames[0]) return;
      paper = samplePaper(frames[0]);
      resize();
      setIsReady(true);
      rafId = requestAnimationFrame(tick);
    })();

    const onResize = () => {
      resize();
      if (isStatic) rafId = requestAnimationFrame(tick);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [dir, frameCount, isMobile, isStatic]);

  const active = captions[caption];
  const percent = Math.round((loaded / total) * 100);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: isStatic ? "100vh" : `${SCROLL_LENGTH_VH}vh` }}
    >
      <div
        className="sticky w-full overflow-hidden"
        style={{ top: topOffset, height: `calc(100vh - ${topOffset})` }}
      >
        <canvas ref={canvasRef} role="img" aria-label={label} className="block h-full w-full" />

        {!isReady && (
          <div
            className="absolute inset-0 grid place-items-center bg-secondary text-ink"
            role="status"
            aria-live="polite"
          >
            <div className="w-56 text-center">
              <p className="text-base font-medium">{t("sequence.loading")}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full origin-left bg-ink/60 transition-transform"
                  style={{ transform: `scaleX(${loaded / total})` }}
                />
              </div>
              <p className="mt-2 text-sm text-caption">{percent}%</p>
            </div>
          </div>
        )}

        {isReady && active && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-10">
            <div
              key={caption}
              className="max-w-md rounded-2xl bg-secondary/95 p-5 text-ink shadow-sm motion-safe:animate-[fadeIn_400ms_ease-out]"
            >
              <p className="text-sm text-caption">
                {t("sequence.step", { n: caption + 1, total: captions.length })}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{active.title}</h2>
              <p className="mt-2 text-base">{active.body}</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
