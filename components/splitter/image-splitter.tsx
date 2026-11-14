"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Columns3,
  Download,
  ExternalLink,
  LayoutGrid,
  Rows3,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionHeading } from "@/components/section-heading";
import { SliceFrame } from "@/components/splitter/slice-frame";
import { XPostPreview } from "@/components/splitter/x-post-preview";
import { ToolErrorBoundary } from "@/components/tool-error-boundary";
import {
  MAX_DIMENSION,
  MAX_FILE_BYTES,
  MAX_PIECES,
  MAX_PIXELS,
  MIN_PIECES,
  WARN_FILE_BYTES,
} from "@/lib/constants";
import { downloadBlob, downloadBlobs, orderNote, zipPieces } from "@/lib/download";
import { archiveFilename, formatBytes, pieceFilename, resolveImageType } from "@/lib/files";
import {
  bestGrid,
  buildLayout,
  clamp,
  pieceSizeLabel,
  type ImageLayout,
} from "@/lib/geometry";
import { createSampleImage } from "@/lib/sample-image";
import { defaultCaption, maxCaptionLength } from "@/lib/site";
import {
  isAbortError,
  type ExportFormat,
} from "@/lib/render-slices";
import {
  openMainSplitSession,
  openSplitSession,
  type SplitSession,
} from "@/lib/split-image";
import { createPublisher } from "@/lib/x-publish";

type SplitMode = "vertical" | "horizontal" | "grid";
type Phase = "idle" | "reading" | "splitting" | "ready" | "error";

interface SourceImage {
  url: string;
  width: number;
  height: number;
  bytes: number;
  name: string;
}

interface Piece {
  index: number;
  width: number;
  height: number;
  blob: Blob;
  url: string;
  name: string;
}

const modes: { id: SplitMode; label: string; icon: typeof Columns3 }[] = [
  { id: "vertical", label: "Vertical", icon: Columns3 },
  { id: "horizontal", label: "Horizontal", icon: Rows3 },
  { id: "grid", label: "Grid", icon: LayoutGrid },
];

function orderHint(rows: number, cols: number, count: number): string {
  const last = String(count).padStart(2, "0");
  if (rows === 1) return `Upload 01 on the left through ${last} on the right.`;
  if (cols === 1) return `Upload 01 at the top through ${last} at the bottom.`;
  return `Upload left to right, then top to bottom, from 01 through ${last}.`;
}

export function ImageSplitter() {
  return (
    <section id="splitter" className="scroll-mt-24 px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          as="h1"
          eyebrow="The Splitter"
          title="Free Image Splitter for X"
          body="Cuts happen in your browser. The file is never uploaded, and the pieces stay in the exact numerical order X expects."
        />
        <div className="mt-12">
          <ToolErrorBoundary>
            <SplitterTool />
          </ToolErrorBoundary>
        </div>
      </div>
    </section>
  );
}

function SplitterTool() {
  const inputId = useId();
  const captionId = useId();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<SplitSession | null>(null);
  const fileRef = useRef<File | null>(null);
  const sourceRef = useRef<SourceImage | null>(null);
  const piecesRef = useRef<Piece[]>([]);
  const jobRef = useRef(0);
  const ingestRef = useRef(0);
  const dragDepth = useRef(0);

  const [source, setSource] = useState<SourceImage | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [mode, setMode] = useState<SplitMode>("vertical");
  const [rows, setRows] = useState(1);
  const [cols, setCols] = useState(20);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [jpegQuality, setJpegQuality] = useState(95);
  const [caption, setCaption] = useState(defaultCaption);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Waiting for an image");
  const [progress, setProgress] = useState({ done: 0, total: 20 });
  const [dragging, setDragging] = useState(false);
  const [makingSample, setMakingSample] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [inspect, setInspect] = useState<number | null>(null);
  const [readyTick, setReadyTick] = useState(0);
  const [readyKey, setReadyKey] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  const count = rows * cols;
  const splitKey = `${source?.url ?? ""}:${rows}:${cols}:${format}:${format === "jpeg" ? jpegQuality : "png"}`;

  const layoutResult = useMemo(() => {
    if (!source) return null;
    try {
      return { ok: true as const, layout: buildLayout(source.width, source.height, rows, cols) };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "This split does not fit the image.",
      };
    }
  }, [source, rows, cols]);

  const layout: ImageLayout | null = layoutResult?.ok ? layoutResult.layout : null;
  const layoutError = layoutResult && !layoutResult.ok ? layoutResult.message : null;

  const replacePieces = useCallback((next: Piece[]) => {
    for (const piece of piecesRef.current) URL.revokeObjectURL(piece.url);
    piecesRef.current = next;
    setPieces(next);
  }, []);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    return () => {
      sessionRef.current?.dispose();
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
      for (const piece of piecesRef.current) URL.revokeObjectURL(piece.url);
    };
  }, []);

  const clearImage = useCallback(() => {
    ingestRef.current += 1;
    jobRef.current += 1;
    sessionRef.current?.dispose();
    sessionRef.current = null;
    fileRef.current = null;
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
    sourceRef.current = null;
    setSource(null);
    replacePieces([]);
    setPhase("idle");
    setReadyKey("");
    setStatus("Waiting for an image");
    setInspect(null);
    toast.message("Image removed");
  }, [replacePieces]);

  const ingest = useCallback(
    async (file: File) => {
      const token = ++ingestRef.current;
      const type = resolveImageType(file);
      if (!type) {
        toast.error("Use a PNG, JPG, or WebP image.");
        return;
      }
      if (file.size === 0) {
        toast.error("That file is empty.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error("That file is over 50 MB. Try a smaller image.");
        return;
      }
      if (file.size > WARN_FILE_BYTES) {
        toast.message("Large image", {
          description: "Splitting stays on this device and may take a moment.",
        });
      }

      setPhase("reading");
      setStatus("Reading image");
      fileRef.current = file;
      try {
        const session = await openSplitSession(file);
        if (token !== ingestRef.current) {
          session.dispose();
          return;
        }
        if (
          session.width < MIN_PIECES ||
          session.height < MIN_PIECES ||
          session.width > MAX_DIMENSION ||
          session.height > MAX_DIMENSION ||
          session.width * session.height > MAX_PIXELS
        ) {
          session.dispose();
          const tooBig = session.width > MAX_DIMENSION || session.height > MAX_DIMENSION || session.width * session.height > MAX_PIXELS;
          toast.error(
            tooBig
              ? "That image is larger than this browser can split reliably. Keep it under 32 megapixels and 16,000 pixels on the long side."
              : "That image is too small to split.",
          );
          setPhase(sourceRef.current ? "ready" : "idle");
          setStatus(sourceRef.current ? "Ready" : "Waiting for an image");
          return;
        }

        const previous = sessionRef.current;
        sessionRef.current = session;
        previous?.dispose();
        const url = URL.createObjectURL(file);
        if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
        const nextSource: SourceImage = {
          url,
          width: session.width,
          height: session.height,
          bytes: file.size,
          name: file.name || "image",
        };
        sourceRef.current = nextSource;
        setSource(nextSource);
        toast.success("Image ready to split.");
      } catch (error) {
        if (token !== ingestRef.current) return;
        if (isAbortError(error)) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "This file could not be read. Use a PNG, JPG, or WebP.",
        );
        setPhase(sourceRef.current ? "ready" : "idle");
        setStatus(sourceRef.current ? "Ready" : "Waiting for an image");
      }
    },
    [],
  );

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
          entry.type.startsWith("image/"),
        );
        if (!item) return;
      }
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((entry) => entry.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void ingest(file);
    }
    function blockBrowserOpen(event: DragEvent) {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    }
    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", blockBrowserOpen);
    window.addEventListener("drop", blockBrowserOpen);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", blockBrowserOpen);
      window.removeEventListener("drop", blockBrowserOpen);
    };
  }, [ingest]);

  useEffect(() => {
    if (!source || !sessionRef.current || layoutError || !layout) return;

    const session = sessionRef.current;
    const rects = layout.rects;
    const job = ++jobRef.current;
    const quality = jpegQuality / 100;
    const key = splitKey;

    const timer = window.setTimeout(() => {
      setPhase("splitting");
      setProgress({ done: 0, total: rects.length });
      setStatus(`Splitting 0 of ${rects.length}`);
      void (async () => {
        try {
          const report = (done: number, total: number) => {
            if (job !== jobRef.current) return;
            setProgress({ done, total });
            setStatus(`Splitting ${done} of ${total}`);
          };
          let rendered;
          try {
            rendered = await session.split({
              rects,
              format,
              quality,
              onProgress: report,
            });
          } catch (error) {
            if (isAbortError(error) || job !== jobRef.current) return;
            const file = fileRef.current;
            if (session.kind !== "worker" || !file) throw error;
            const fallback = await openMainSplitSession(file);
            if (job !== jobRef.current) {
              fallback.dispose();
              return;
            }
            const previous = sessionRef.current;
            sessionRef.current = fallback;
            previous?.dispose();
            rendered = await fallback.split({
              rects,
              format,
              quality,
              onProgress: report,
            });
          }

          if (job !== jobRef.current) return;
          const next = rendered
            .slice()
            .sort((a, b) => a.index - b.index)
            .map((slice) => ({
              ...slice,
              url: URL.createObjectURL(slice.blob),
              name: pieceFilename(slice.index, format),
            }));
          replacePieces(next);
          setReadyKey(key);
          setPhase("ready");
          setStatus(`${next.length} images ready`);
          setReadyTick((value) => value + 1);
        } catch (error) {
          if (isAbortError(error) || job !== jobRef.current) return;
          const message =
            error instanceof Error ? error.message : "Could not split this image.";
          replacePieces([]);
          setPhase("error");
          setStatus(message);
          toast.error(message);
        }
      })();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      jobRef.current += 1;
    };
  }, [source, layout, layoutError, format, jpegQuality, retryTick, replacePieces, splitKey]);

  function applyCount(next: number, nextMode = mode) {
    const safe = clamp(Math.round(next), MIN_PIECES, MAX_PIECES);
    if (nextMode === "vertical") {
      setRows(1);
      setCols(safe);
      return;
    }
    if (nextMode === "horizontal") {
      setRows(safe);
      setCols(1);
      return;
    }
    const grid = bestGrid(safe);
    setRows(grid.rows);
    setCols(grid.cols);
  }

  function changeMode(next: SplitMode) {
    setMode(next);
    applyCount(count, next);
  }

  function setGrid(nextRows: number, nextCols: number) {
    const nextC = clamp(nextCols, 1, MAX_PIECES);
    let nextR = clamp(nextRows, 1, MAX_PIECES);
    if (nextC * nextR > MAX_PIECES) nextR = Math.max(1, Math.floor(MAX_PIECES / nextC));
    if (nextC * nextR < MIN_PIECES) {
      toast.error("X posts here use between 2 and 20 images.");
      return;
    }
    setRows(nextR);
    setCols(nextC);
  }

  function takeFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    if (files.length > 1) toast.message("Using the first image.");
    void ingest(files[0]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function loadSample() {
    setMakingSample(true);
    try {
      const file = await createSampleImage();
      await ingest(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create a sample.");
    } finally {
      setMakingSample(false);
    }
  }

  useEffect(() => {
    async function handleCustomLoad(event: Event) {
      const customEvent = event as CustomEvent<{ src: string; name?: string }>;
      const { src, name } = customEvent.detail || {};
      if (!src) return;
      setMakingSample(true);
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("Failed to fetch image");
        const blob = await res.blob();
        const filename = name || "preset-panorama.png";
        const file = new File([blob], filename, { type: blob.type || "image/png" });
        await ingest(file);
        document.getElementById("splitter")?.scrollIntoView({ behavior: "smooth" });
      } catch {
        toast.error("Could not load selected image.");
      } finally {
        setMakingSample(false);
      }
    }

    window.addEventListener("picsnips:load-image", handleCustomLoad);

    // Auto-load if navigated with ?image= from library page
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const imgParam = params.get("image");
      const nameParam = params.get("name") || "library-preset.png";
      if (imgParam) {
        handleCustomLoad(
          new CustomEvent("picsnips:load-image", {
            detail: { src: imgParam, name: nameParam },
          })
        );
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    return () => window.removeEventListener("picsnips:load-image", handleCustomLoad);
  }, [ingest]);

  async function downloadZip() {
    if (phase !== "ready" || pieces.length === 0 || !source) return;
    setZipping(true);
    setZipProgress(0);
    try {
      const blob = await zipPieces(
        pieces.map((piece) => ({ blob: piece.blob, name: piece.name })),
        orderNote({
          count: pieces.length,
          rows,
          cols,
          width: source.width,
          height: source.height,
          format,
          names: pieces.map((piece) => `${piece.name}  ${piece.width}×${piece.height}`),
        }),
        setZipProgress,
      );
      downloadBlob(blob, archiveFilename(pieces.length, rows, cols));
      toast.success(`Downloaded ${pieces.length} images in a ZIP.`, {
        description: "They are numbered from 01. Attach them to X in that order.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the ZIP.");
    } finally {
      setZipping(false);
    }
  }

  function downloadEach() {
    if (phase !== "ready" || pieces.length === 0) return;
    downloadBlobs(pieces.map((piece) => ({ blob: piece.blob, name: piece.name })));
    toast.message(`Started ${pieces.length} downloads`, {
      description:
        "If your browser only saves one file, allow multiple downloads, or use the ZIP.",
    });
  }

  async function postToX() {
    const publisher = createPublisher();
    try {
      const result = await publisher.publish({
        text: caption,
        imageCount: count,
        filenames: pieces.map((piece) => piece.name),
      });
      if (!result.opened) {
        toast.error("Your browser blocked the X window. Allow pop-ups and try again.");
        return;
      }
      toast.message("X composer opened", {
        description: `Attach the images yourself, in order from 01. PicSnips cannot post them for you.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open X.");
    }
  }

  const exact =
    phase === "ready" &&
    readyKey === splitKey &&
    pieces.length === count &&
    !layoutError;
  const statusText = layoutError ?? (phase === "reading" || phase === "splitting" || phase === "error" || exact ? status : "Preparing slices");
  const activePiece = pieces.find((piece) => piece.index === inspect) ?? null;
  const activeRect = layout?.rects.find((rect) => rect.index === inspect) ?? null;

  useEffect(() => {
    if (inspect == null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      setInspect((current) => {
        if (current == null) return current;
        if (event.key === "ArrowRight") return current >= count ? 1 : current + 1;
        return current <= 1 ? count : current - 1;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspect, count]);

  return (
    <div className="rounded-[2rem] border border-border bg-card/70 p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:p-6 lg:p-8">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        onChange={(event) => takeFiles(event.target.files)}
      />

      {!source ? (
        <div className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload an image to split"
          aria-busy={phase === "reading" || makingSample}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            takeFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            dragging
              ? "border-foreground bg-foreground/5"
              : "border-border dark:border-white/15 bg-muted/20 dark:bg-white/[0.02] hover:border-foreground/30 hover:bg-muted/40 dark:hover:border-white/30 dark:hover:bg-white/[0.04]",
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-muted/60 dark:bg-white/5">
            <Upload className="size-6" />
          </span>
          <p className="mt-5 text-lg font-medium">
            {phase === "reading" || makingSample ? "Reading image…" : "Drop an image here"}
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            PNG, JPG, or WebP. Click to browse, or paste from your clipboard. Nothing is uploaded.
          </p>
          <span className="mt-6 inline-flex h-8 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
            Browse files
          </span>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-500 dark:text-emerald-400">
              <Check className="size-3.5" />
              Free to use
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-500 dark:text-emerald-400">
              <Check className="size-3.5" />
              No signup required
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span>100% In-Browser</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-4"
            disabled={makingSample || phase === "reading"}
            onClick={() => void loadSample()}
          >
            {makingSample ? "Creating sample…" : "Try sample panorama"}
          </Button>
          <Button
            asChild
            variant="ghost"
            className="rounded-full px-4 text-muted-foreground hover:text-foreground border border-border dark:border-white/5 bg-muted/40 dark:bg-white/[0.03]"
          >
            <Link href="/library">Browse Stock Library (15+)</Link>
          </Button>
        </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.85fr)]">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 text-sm text-muted-foreground">
                  <span className="truncate font-medium text-foreground">{source.name}</span>
                  <span className="mx-2 text-white/20">/</span>
                  {source.width} × {source.height}
                  <span className="mx-2 text-white/20">/</span>
                  {formatBytes(source.bytes)}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => inputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={clearImage}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-black"
                onDragEnter={(event) => {
                  event.preventDefault();
                  dragDepth.current += 1;
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  dragDepth.current -= 1;
                  if (dragDepth.current <= 0) {
                    dragDepth.current = 0;
                    setDragging(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dragDepth.current = 0;
                  setDragging(false);
                  takeFiles(event.dataTransfer.files);
                }}
              >
                <div className="flex justify-center p-3 sm:p-4">
                  <div className="relative w-fit max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={source.url}
                      alt="Uploaded image with split guides"
                      className="block max-h-[520px] max-w-full"
                      draggable={false}
                    />
                    {layout && (
                      <div className="pointer-events-none absolute inset-0">
                        {layout.colRanges.slice(1).map((range) => (
                          <span
                            key={`c-${range.start}`}
                            className="absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.75)]"
                            style={{ left: `${(range.start / source.width) * 100}%` }}
                          />
                        ))}
                        {layout.rowRanges.slice(1).map((range) => (
                          <span
                            key={`r-${range.start}`}
                            className="absolute inset-x-0 h-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.75)]"
                            style={{ top: `${(range.start / source.height) * 100}%` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {phase === "splitting" && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                    <div
                      className="h-full bg-white transition-[width] duration-150"
                      style={{
                        width: `${progress.total === 0 ? 0 : (progress.done / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                )}
                {dragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-medium">
                    Drop to replace
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium">Direction</p>
                <div role="radiogroup" aria-label="Split direction" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/70 p-1">
                  {modes.map((item) => {
                    const Icon = item.icon;
                    const selected = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => changeMode(item.id)}
                        aria-label={item.label}
                        className={cn(
                          "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition",
                          selected
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="hidden sm:inline lg:inline">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label htmlFor={`${inputId}-count`} className="text-sm font-medium">
                    Pieces
                  </label>
                  <span className="text-sm text-muted-foreground tabular-nums">{count} of 20</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Fewer pieces"
                    disabled={count <= MIN_PIECES}
                    onClick={() => applyCount(count - 1)}
                  >
                    −
                  </Button>
                  <Slider
                    value={[count]}
                    min={MIN_PIECES}
                    max={MAX_PIECES}
                    step={1}
                    aria-label="Number of pieces"
                    onValueChange={(value) => applyCount(value[0] ?? count)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="More pieces"
                    disabled={count >= MAX_PIECES}
                    onClick={() => applyCount(count + 1)}
                  >
                    +
                  </Button>
                  <input
                    id={`${inputId}-count`}
                    type="number"
                    inputMode="numeric"
                    min={MIN_PIECES}
                    max={MAX_PIECES}
                    value={count}
                    aria-label="Piece count"
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next)) applyCount(next);
                    }}
                    className="h-8 w-14 rounded-lg border border-input bg-input/30 text-center text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                {mode === "grid" && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Stepper
                      label="Columns"
                      value={cols}
                      onChange={(value) => setGrid(rows, value)}
                    />
                    <Stepper
                      label="Rows"
                      value={rows}
                      onChange={(value) => setGrid(value, cols)}
                    />
                  </div>
                )}
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {layout
                    ? `${rows} × ${cols}. Each piece is ${pieceSizeLabel(layout.rects)}. ${orderHint(rows, cols, count)}`
                    : layoutError}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Export</p>
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1">
                  {(["png", "jpeg"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={format === item}
                      onClick={() => setFormat(item)}
                      className={cn(
                        "h-10 rounded-xl text-sm font-medium transition",
                        format === item
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item === "png" ? "PNG" : "JPEG"}
                    </button>
                  ))}
                </div>
                {format === "jpeg" ? (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <label htmlFor={`${inputId}-quality`}>JPEG quality</label>
                      <span className="tabular-nums text-muted-foreground">{jpegQuality}</span>
                    </div>
                    <Slider
                      id={`${inputId}-quality`}
                      value={[jpegQuality]}
                      min={80}
                      max={100}
                      step={1}
                      aria-label="JPEG quality"
                      onValueChange={(value) => setJpegQuality(value[0] ?? 95)}
                    />
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Transparency is flattened onto white. PNG stays lossless.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    PNG keeps the decoded pixels without extra compression. EXIF metadata is not copied.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold tracking-tight">Pieces</h3>
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <AnimatePresence mode="wait">
                  {exact && (
                    <motion.span
                      key={readyTick}
                      initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 460, damping: 18 }}
                      className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-400 text-emerald-950"
                    >
                      <Check className="size-3" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {statusText}
              </p>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              role="list"
              aria-label="Split pieces in upload order"
            >
              {layout?.rects.map((rect) => {
                const piece = exact ? pieces.find((item) => item.index === rect.index) : undefined;
                const name = piece?.name ?? pieceFilename(rect.index, format);
                return (
                  <div key={rect.index} role="listitem" className="w-24 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspect(rect.index)}
                      className="block w-full overflow-hidden rounded-xl border border-white/10 bg-black text-left focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={`Inspect ${name}`}
                    >
                      <div className="relative h-28">
                        <SliceFrame
                          src={source.url}
                          blobUrl={piece?.url}
                          imageWidth={source.width}
                          imageHeight={source.height}
                          sx={rect.sx}
                          sy={rect.sy}
                          sw={rect.sw}
                          sh={rect.sh}
                          alt=""
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </button>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span className="font-mono text-xs text-muted-foreground">{name}</span>
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-40"
                        aria-label={`Download ${name}`}
                        disabled={!piece}
                        onClick={() => piece && downloadBlob(piece.blob, piece.name)}
                      >
                        <Download className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor={captionId} className="text-sm font-medium">
              Caption for X
            </label>
            <textarea
              id={captionId}
              value={caption}
              maxLength={maxCaptionLength}
              rows={3}
              onChange={(event) => setCaption(event.target.value)}
              className="w-full resize-none rounded-2xl border border-input bg-input/20 px-4 py-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">
              {caption.length}/{maxCaptionLength}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="h-11 rounded-full px-5"
              disabled={!exact || zipping}
              onClick={() => void downloadZip()}
            >
              <Download />
              {zipping
                ? `Packing ${Math.round(zipProgress)}%`
                : `Download All ${count} Images`}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              disabled={!exact}
              onClick={downloadEach}
            >
              Download individually
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-full px-5"
              onClick={() => void postToX()}
            >
              <ExternalLink />
              Post to X
            </Button>
            {phase === "error" && !layoutError && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
                onClick={() => setRetryTick((value) => value + 1)}
              >
                Try again
              </Button>
            )}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Post to X opens the composer with your caption filled in. Images must be attached manually, in order, starting with 01. This app does not publish for you.
          </p>

          {layout && (
            <XPostPreview
              src={source.url}
              width={source.width}
              height={source.height}
              rects={layout.rects}
              colRanges={layout.colRanges}
              rowRanges={layout.rowRanges}
              caption={caption}
              onInspect={setInspect}
            />
          )}
        </div>
      )}

      <Dialog open={inspect != null} onOpenChange={(open) => !open && setInspect(null)}>
        <DialogContent className="sm:max-w-3xl">
          {inspect != null && source && activeRect && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {pieceFilename(inspect, format)} · {activeRect.sw} × {activeRect.sh}
                </DialogTitle>
                <DialogDescription>
                  Slice {inspect} of {count}. {orderHint(rows, cols, count)} Arrow keys move between slices.
                </DialogDescription>
              </DialogHeader>
              <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl bg-black">
                <div
                  className="max-h-[60vh] max-w-full"
                  style={{ aspectRatio: `${activeRect.sw} / ${activeRect.sh}`, height: "60vh" }}
                >
                  <SliceFrame
                    src={source.url}
                    blobUrl={activePiece?.url}
                    imageWidth={source.width}
                    imageHeight={source.height}
                    sx={activeRect.sx}
                    sy={activeRect.sy}
                    sw={activeRect.sw}
                    sh={activeRect.sh}
                    alt={`Slice ${inspect} of ${count}`}
                    className="h-full w-full"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInspect(inspect <= 1 ? count : inspect - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInspect(inspect >= count ? 1 : inspect + 1)}
                  >
                    Next
                  </Button>
                </div>
                <Button
                  type="button"
                  disabled={!activePiece}
                  onClick={() => activePiece && downloadBlob(activePiece.blob, activePiece.name)}
                >
                  <Download />
                  Download {pieceFilename(inspect, format)}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(value - 1)}
        >
          −
        </Button>
        <input
          id={id}
          type="number"
          min={1}
          max={MAX_PIECES}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(next);
          }}
          className="h-7 w-full rounded-lg border border-input bg-input/30 text-center text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
        >
          +
        </Button>
      </div>
    </div>
  );
}
