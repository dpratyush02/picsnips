"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "cn";
import type { AxisRange, SliceRect } from "@/lib/geometry";
import { SliceFrame } from "@/components/splitter/slice-frame";

export function XPostPreview({
  src,
  width,
  height,
  rects,
  colRanges,
  rowRanges,
  caption,
  onInspect,
}: {
  src: string;
  width: number;
  height: number;
  rects: SliceRect[];
  colRanges: AxisRange[];
  rowRanges: AxisRange[];
  caption: string;
  onInspect: (index: number) => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const rows = rowRanges.length;
  const cols = colRanges.length;
  const maxHeight = device === "mobile" ? 260 : 340;

  return (
    <div className="rounded-3xl border border-border bg-black/40 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">X layout preview</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Illustrative only. X may crop or arrange a 20-image post differently. This shows your slices in upload order.
          </p>
        </div>
        <div
          className="inline-flex shrink-0 rounded-full border border-border bg-background/60 p-1"
          role="group"
          aria-label="Preview size"
        >
          <DeviceButton
            active={device === "desktop"}
            onClick={() => setDevice("desktop")}
            label="Desktop preview"
          >
            <Monitor />
            Desktop
          </DeviceButton>
          <DeviceButton
            active={device === "mobile"}
            onClick={() => setDevice("mobile")}
            label="Mobile preview"
          >
            <Smartphone />
            Mobile
          </DeviceButton>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl",
          device === "mobile" ? "max-w-[380px]" : "max-w-[598px]",
        )}
      >
        <div className="flex gap-3 px-4 pt-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
            Y
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold">You</span>
              <span className="text-muted-foreground">@you</span>
            </div>
            <p className="mt-1 text-sm leading-6 break-words whitespace-pre-wrap">
              {caption.trim() || (
                <span className="text-muted-foreground">Your caption appears here.</span>
              )}
            </p>
          </div>
        </div>

        <div className="px-4 pt-3 pb-4">
          <div
            className="mx-auto overflow-hidden rounded-2xl bg-zinc-950"
            style={{ width: `min(100%, calc(${maxHeight}px * ${width} / ${height}))` }}
          >
            {rows === 1 ? (
              <div className="flex w-full" style={{ aspectRatio: `${width} / ${height}` }}>
                {rects.map((rect) => (
                  <SliceButton
                    key={rect.index}
                    rect={rect}
                    src={src}
                    width={width}
                    height={height}
                    total={rects.length}
                    onInspect={onInspect}
                    className="h-full"
                    style={{ width: `${(rect.sw / width) * 100}%` }}
                  />
                ))}
              </div>
            ) : cols === 1 ? (
              <div className="flex w-full flex-col" style={{ aspectRatio: `${width} / ${height}` }}>
                {rects.map((rect) => (
                  <SliceButton
                    key={rect.index}
                    rect={rect}
                    src={src}
                    width={width}
                    height={height}
                    total={rects.length}
                    onInspect={onInspect}
                    className="w-full"
                    style={{ height: `${(rect.sh / height) * 100}%` }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="grid w-full"
                style={{
                  aspectRatio: `${width} / ${height}`,
                  gridTemplateColumns: colRanges.map((range) => `${range.size}fr`).join(" "),
                  gridTemplateRows: rowRanges.map((range) => `${range.size}fr`).join(" "),
                }}
              >
                {rects.map((rect) => (
                  <SliceButton
                    key={rect.index}
                    rect={rect}
                    src={src}
                    width={width}
                    height={height}
                    total={rects.length}
                    onInspect={onInspect}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Preview chrome, not a live post.
          </p>
        </div>
      </div>
    </div>
  );
}

function DeviceButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SliceButton({
  rect,
  src,
  width,
  height,
  total,
  onInspect,
  className,
  style,
}: {
  rect: SliceRect;
  src: string;
  width: number;
  height: number;
  total: number;
  onInspect: (index: number) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const name = String(rect.index).padStart(2, "0");
  return (
    <button
      type="button"
      className={cn(
        "relative min-h-0 min-w-0 overflow-hidden focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white",
        className,
      )}
      style={style}
      onClick={() => onInspect(rect.index)}
      aria-label={`Inspect slice ${name} of ${total}`}
    >
      <SliceFrame
        src={src}
        imageWidth={width}
        imageHeight={height}
        sx={rect.sx}
        sy={rect.sy}
        sw={rect.sw}
        sh={rect.sh}
        alt=""
        className="absolute inset-0 h-full w-full"
      />
    </button>
  );
}
