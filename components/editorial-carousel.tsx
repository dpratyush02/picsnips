"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

type Slide = { id: string; label: string };

function offset(index: number, active: number, total: number) {
  const distance = (index - active + total) % total;
  return distance > total / 2 ? distance - total : distance;
}

const motionPreference = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(change: () => void) {
  const preference = window.matchMedia(motionPreference);
  preference.addEventListener("change", change);
  return () => preference.removeEventListener("change", change);
}

function prefersReducedMotion() {
  return window.matchMedia(motionPreference).matches;
}

export function EditorialCarousel<T extends Slide>({
  label,
  variant,
  slides,
  initialIndex = 0,
  renderSlide,
  renderCaption,
}: {
  label: string;
  variant: "images" | "posts";
  slides: readonly T[];
  initialIndex?: number;
  renderSlide: (slide: T, preloadPosts: boolean) => ReactNode;
  renderCaption?: (slide: T) => ReactNode;
}) {
  const [selection, setSelection] = useState(() => {
    const index = Math.max(0, Math.min(initialIndex, slides.length - 1));
    return { active: index, previous: index };
  });
  const [playbackOverride, setPlaybackOverride] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, prefersReducedMotion, () => false);
  const playing = playbackOverride ?? !reducedMotion;
  const [inView, setInView] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const playback = useRef<HTMLButtonElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const ignoreClick = useRef(false);
  const total = slides.length;

  function select(index: number) {
    setSelection((current) => index === current.active ? current : { active: index, previous: current.active });
  }

  function move(direction: number) {
    select((selection.active + direction + total) % total);
  }

  useEffect(() => {
    if (!viewport.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      setInView(visible);
      if (visible) setHasEnteredView(true);
    }, { threshold: 0.15 });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView || hovered || total < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setSelection(({ active }) => ({ active: (active + 1) % total, previous: active }));
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [playing, inView, hovered, selection.active, total]);

  if (!total) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="editorial-carousel"
      data-variant={variant}
      onFocusCapture={(event) => {
        const target = event.nativeEvent.target;
        if (target instanceof HTMLElement && target !== playback.current && target.matches(":focus-visible")) {
          setPlaybackOverride(false);
        }
      }}
      onKeyDown={(event) => {
        if (total < 2 || !(event.target instanceof HTMLButtonElement) || !event.currentTarget.contains(event.target)) return;
        if (event.key === "ArrowLeft") move(-1);
        else if (event.key === "ArrowRight") move(1);
        else if (event.key === "Home") select(0);
        else if (event.key === "End") select(total - 1);
        else return;
        event.preventDefault();
      }}
    >
      <div
        ref={viewport}
        className="carousel-viewport"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(event) => {
          ignoreClick.current = false;
          if (total > 1 && event.isPrimary && event.button === 0) {
            pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          }
        }}
        onPointerUp={(event) => {
          if (pointer.current?.id !== event.pointerId) return;
          const dx = event.clientX - pointer.current.x;
          const dy = event.clientY - pointer.current.y;
          pointer.current = null;
          if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy)) {
            ignoreClick.current = true;
            move(dx > 0 ? -1 : 1);
          }
        }}
        onPointerCancel={() => { pointer.current = null; }}
        onClickCapture={(event) => {
          if (event.detail > 0 && ignoreClick.current) {
            event.preventDefault();
            event.stopPropagation();
            ignoreClick.current = false;
          }
        }}
      >
        {slides.map((slide, index) => {
          const position = offset(index, selection.active, total);
          const active = position === 0;
          const adjacent = Math.abs(position) === 1;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}: ${slide.label}`}
              aria-hidden={!active}
              className="carousel-slide"
              data-position={active ? "center" : adjacent ? (position < 0 ? "left" : "right") : "hidden"}
              data-side={position < 0 ? "left" : "right"}
              data-wrap={Math.abs(position - offset(index, selection.previous, total)) > 1 || undefined}
            >
              <div inert={!active} className="carousel-slide-content">
                {renderSlide(slide, hasEnteredView)}
              </div>
              {adjacent && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute inset-0 z-10 cursor-pointer"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => select(index)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="site-width mt-5 text-center sm:mt-7">
        {renderCaption && (
          <div className="min-h-24">
            {slides.map((slide, index) => (
              <div key={slide.id} hidden={index !== selection.active}>
                {renderCaption(slide)}
              </div>
            ))}
          </div>
        )}
        {total > 1 && (
          <div className="mt-3">
            <div className="inline-flex gap-0.5 rounded-full border border-border bg-card p-1" role="group" aria-label="Playback">
              <button type="button" aria-label="Previous slide" className="carousel-control" onClick={() => move(-1)}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                ref={playback}
                type="button"
                className="carousel-control bg-muted"
                aria-label={playing ? "Pause carousel" : "Play carousel"}
                onClick={() => setPlaybackOverride(!playing)}
              >
                {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              </button>
              <button type="button" aria-label="Next slide" className="carousel-control" onClick={() => move(1)}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        <p className="sr-only" aria-live={playing ? "off" : "polite"}>
          {`${selection.active + 1} of ${total}: ${slides[selection.active].label}`}
        </p>
      </div>
    </div>
  );
}
