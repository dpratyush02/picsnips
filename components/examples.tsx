"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ExternalLink, Scissors } from "lucide-react";
import { cn } from "cn";
import { SectionHeading } from "@/components/section-heading";
import { sceneSrc, scenes, type Scene } from "@/components/scenes";
import { Button } from "@/components/ui/button";

export function Examples() {
  const [active, setActive] = useState(scenes[0].id);
  const scene = scenes.find((item) => item.id === active) ?? scenes[0];

  const handleLoadInSplitter = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("picsnips:load-image", {
          detail: {
            src: scene.fullSrc,
            name: `${scene.id}-original.jpg`,
          },
        })
      );
    }
  };

  return (
    <section id="examples" className="scroll-mt-24 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Real Posts on X"
          title="See how 20-image posts look on X."
          body="Actual 20-slice posts published on X. Drag the comparison slider to see the seamless transition from the full original picture to the 20 vertical slices."
        />

        {/* Tab pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Example posts">
          {scenes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scene.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition font-medium",
                item.id === scene.id
                  ? "border-foreground bg-foreground text-background shadow-md"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Post Container Card */}
        <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/10 bg-card/60 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
          {/* Twitter / X Post Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={scene.authorAvatar}
                alt={scene.authorName}
                className="size-11 rounded-full border border-white/10 object-cover bg-white/5"
              />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                  <span>{scene.authorName}</span>
                  {/* Verified check */}
                  <svg viewBox="0 0 24 24" aria-label="Verified account" className="size-4 fill-sky-400">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.85.6 11.22.6 12.8c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4zM10.2 16.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.3-5.3 1.4 1.4-6.7 6.7z" />
                  </svg>
                  <span className="text-xs text-muted-foreground font-normal">@{scene.authorHandle}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5">{scene.caption}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadInSplitter}
                className="rounded-full gap-1.5 text-xs"
              >
                <Scissors className="size-3.5" />
                Load in Splitter
              </Button>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white"
              >
                <a href={scene.tweetUrl} target="_blank" rel="noreferrer">
                  <span>View on X</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Interactive Comparison Component */}
          <div className="mt-4">
            <Compare key={scene.id} scene={scene} />
          </div>

          {/* Footer stats bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-3 border-t border-white/5">
            <span className="font-mono">Total slices: 20 vertical frames</span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" />
              Published with PicSnips
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Compare({ scene }: { scene: Scene }) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(62);
  const paused = useRef(false);
  const src = sceneSrc(scene);

  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    let current = 62;
    let direction = -1;
    const tick = () => {
      if (!paused.current) {
        current += direction * 0.35;
        if (current <= 8 || current >= 92) direction *= -1;
        setValue(current);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduce, scene]);

  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-black shadow-[0_30px_80px_-48px_rgba(0,0,0,0.9)]">
      <div className="relative aspect-[2.2/1] min-h-56 sm:min-h-72">
        {/* Sliced 20 pieces */}
        <Sliced slices={scene.slices} />

        {/* Original uncut image masked by clip-path */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url("${src}")` }}
            role="img"
            aria-label={`${scene.title}, original panorama`}
          />
        </div>

        {/* Divider Slider Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.7)]"
          style={{ left: `${value}%` }}
        >
          <span className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/20 bg-white shadow-lg flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="size-3.5 fill-black">
              <path d="M5.5 3L2 8l3.5 5v-3h5v3l3.5-5L10.5 3v3h-5V3z" />
            </svg>
          </span>
        </div>

        {/* Invisible Range Input for Dragging */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(value)}
          aria-label={`Compare the original ${scene.title} with 20 slices`}
          onPointerDown={() => {
            paused.current = true;
          }}
          onChange={(event) => {
            paused.current = true;
            setValue(Number(event.target.value));
          }}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />

        {/* Badges */}
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-medium border border-white/10 text-white">
          Original Panorama
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-medium border border-white/10 text-white font-mono">
          20 Slices on X
        </span>
      </div>
    </div>
  );
}

function Sliced({ slices }: { slices: string[] }) {
  return (
    <div className="flex h-full w-full gap-0.5 bg-black" aria-hidden="true">
      {slices.map((sliceUrl, index) => (
        <div
          key={index}
          className="group relative h-full min-w-0 flex-1 bg-cover bg-center overflow-hidden"
          style={{
            backgroundImage: `url("${sliceUrl}")`,
          }}
        >
          {/* Subtle slice index label on hover */}
          <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1 text-[9px] font-mono text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
