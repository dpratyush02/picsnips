/// <reference lib="webworker" />

import type { SliceRect } from "@/lib/geometry";
import {
  isAbortError,
  renderSlices,
  type ExportFormat,
  type RenderedSlice,
} from "@/lib/render-slices";

interface LoadMessage {
  type: "load";
  id: number;
  generation: number;
  buffer: ArrayBuffer;
  mime: string;
}

interface SplitMessage {
  type: "split";
  id: number;
  generation: number;
  rects: SliceRect[];
  format: ExportFormat;
  quality: number;
}

interface ClearMessage {
  type: "clear";
  id: number;
  generation: number;
}

type InMessage = LoadMessage | SplitMessage | ClearMessage;

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<InMessage>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

let bitmap: ImageBitmap | null = null;
let currentGeneration = 0;
let latestSplit = 0;
let chain: Promise<void> = Promise.resolve();

function post(message: unknown, transfer?: Transferable[]) {
  scope.postMessage(message, transfer);
}

async function decode(buffer: ArrayBuffer, mime: string): Promise<ImageBitmap> {
  const blob = new Blob([buffer], { type: mime || "image/png" });
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(blob);
  }
}

async function handle(message: InMessage): Promise<void> {
  if (message.type === "clear") {
    if (message.generation === currentGeneration) {
      bitmap?.close();
      bitmap = null;
    }
    post({ type: "cleared", id: message.id });
    return;
  }

  if (message.type === "load") {
    try {
      const next = await decode(message.buffer, message.mime);
      if (message.generation < currentGeneration) {
        next.close();
        post({ type: "skipped", id: message.id });
        return;
      }
      bitmap?.close();
      bitmap = next;
      currentGeneration = message.generation;
      post({
        type: "loaded",
        id: message.id,
        width: next.width,
        height: next.height,
      });
    } catch {
      post({
        type: "error",
        id: message.id,
        message: "This file could not be read. Use a PNG, JPG, or WebP.",
      });
    }
    return;
  }

  const splitId = message.id;
  if (splitId !== latestSplit || message.generation !== currentGeneration) {
    post({ type: "skipped", id: splitId });
    return;
  }
  if (!bitmap) {
    post({ type: "error", id: splitId, message: "Load an image before splitting." });
    return;
  }

  try {
    const rendered: RenderedSlice[] = await renderSlices(
      bitmap,
      message.rects,
      message.format,
      message.quality,
      {
        shouldContinue: () =>
          splitId === latestSplit && message.generation === currentGeneration,
        onProgress: (done, total) => post({ type: "progress", id: splitId, done, total }),
      },
    );
    if (splitId !== latestSplit || message.generation !== currentGeneration) {
      post({ type: "skipped", id: splitId });
      return;
    }

    const slices = await Promise.all(
      rendered.map(async (slice) => ({
        index: slice.index,
        width: slice.width,
        height: slice.height,
        type: slice.blob.type,
        buffer: await slice.blob.arrayBuffer(),
      })),
    );
    post(
      { type: "done", id: splitId, slices },
      slices.map((slice) => slice.buffer),
    );
  } catch (error) {
    if (isAbortError(error) || splitId !== latestSplit) {
      post({ type: "skipped", id: splitId });
      return;
    }
    post({
      type: "error",
      id: splitId,
      message:
        error instanceof Error
          ? error.message
          : "This browser could not split that image.",
    });
  }
}

scope.onmessage = (event: MessageEvent<InMessage>) => {
  const message = event.data;
  if (message.type === "split") {
    latestSplit = Math.max(latestSplit, message.id);
  }
  chain = chain.then(
    () => handle(message),
    () => handle(message),
  );
};

export {};
