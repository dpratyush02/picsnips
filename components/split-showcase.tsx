"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, ChevronsLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scenes, sceneSplitterHref } from "@/components/scenes";

const steps = ["Original image", "Split preview", "Download order"] as const;
type Step = (typeof steps)[number];

export function SplitShowcase() {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("Split preview");
  const [divider, setDivider] = useState(52);
  const scene = scenes[index];

  function changeScene(offset: number) {
    setIndex((active) => (active + offset + scenes.length) % scenes.length);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-[10px]">
        <div role="group" aria-label="Preview stage" className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {steps.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={step === item}
              onClick={() => setStep(item)}
              className="min-h-9 rounded-lg px-2.5 text-xs transition-colors aria-pressed:bg-card aria-pressed:text-foreground hover:text-foreground sm:px-3 sm:text-sm"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon-lg" type="button" onClick={() => changeScene(-1)} aria-label="Previous example">
            <ChevronLeft />
          </Button>
          <span aria-live="polite" className="font-mono text-xs text-muted-foreground">{index + 1} / {scenes.length}</span>
          <Button variant="ghost" size="icon-lg" type="button" onClick={() => changeScene(1)} aria-label="Next example">
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-black focus-within:ring-2 focus-within:ring-ring sm:aspect-[2.38/1]">
        <Image src={scene.fullSrc} alt={scene.title} fill sizes="(max-width: 1280px) 94vw, 1200px" className="object-cover" />
        {step !== "Original image" && (
          <div
            aria-hidden="true"
            className="hero-slice-lines pointer-events-none absolute inset-0"
            style={step === "Split preview" ? { clipPath: `inset(0 0 0 ${divider}%)` } : undefined}
          />
        )}
        {step === "Split preview" && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-white" style={{ left: `${divider}%` }}>
              <span className="absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black ring-1 ring-black/30">
                <ChevronsLeftRight className="size-4" />
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={95}
              value={divider}
              onChange={(event) => setDivider(Number(event.currentTarget.value))}
              aria-label="Compare the original image with the split preview"
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
          </>
        )}
        {step === "Download order" && (
          <ol aria-label="Export order, 01 through 20" className="slice-order absolute inset-x-0 bottom-0 grid grid-cols-20 bg-black/75 py-2 text-center font-mono text-[9px] text-white sm:py-3 sm:text-xs">
            {scene.slices.map((_, number) => <li key={number}><span>{String(number + 1).padStart(2, "0")}</span></li>)}
          </ol>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-2.5 pb-1 pt-3 sm:px-3">
        <div>
          <p className="text-sm font-medium">{scene.title}</p>
          <a href={scene.tweetUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
            View original X post <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
        </div>
        <Button asChild className="editorial-button">
          <Link
            href={sceneSplitterHref(scene)}
            prefetch={false}
          >
            Try this image <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
