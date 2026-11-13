"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { SectionHeading } from "@/components/section-heading";
import { sceneSrc, scenes, type Scene } from "@/components/scenes";

export function Examples() {
  const [active, setActive] = useState(scenes[0].id);
  const scene = scenes.find((item) => item.id === active) ?? scenes[0];

  return (
    <section id="examples" className="scroll-mt-24 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Examples"
          title="The cut is the whole trick."
          body="Drag the comparison. The left side is the original panorama. The right side is the same picture, already divided into 20 frames."
        />
        <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Example panoramas">
          {scenes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scene.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                item.id === scene.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
        <Compare key={scene.id} scene={scene} />
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
          {scene.caption}
        </p>
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
    <div className="relative mt-8 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_30px_80px_-48px_rgba(0,0,0,0.9)]">
      <div className="relative aspect-[2.4/1] min-h-48">
        <Sliced src={src} />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url("${src}")` }}
            role="img"
            aria-label={`${scene.title}, original`}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.7)]"
          style={{ left: `${value}%` }}
        >
          <span className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/20 bg-white shadow-lg" />
        </div>
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
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs">
          Original
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs">
          20 slices
        </span>
      </div>
    </div>
  );
}

function Sliced({ src }: { src: string }) {
  return (
    <div className="flex h-full w-full gap-0.5 bg-black" aria-hidden="true">
      {Array.from({ length: 20 }, (_, index) => (
        <div
          key={index}
          className="h-full min-w-0 flex-1 bg-no-repeat"
          style={{
            backgroundImage: `url("${src}")`,
            backgroundSize: "2000% 100%",
            backgroundPosition: `${(index / 19) * 100}% 50%`,
          }}
        />
      ))}
    </div>
  );
}
