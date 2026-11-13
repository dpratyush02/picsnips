import type { SliceRect } from "@/lib/geometry";
import {
  isAbortError,
  renderSlices,
  type ExportFormat,
  type RenderedSlice,
} from "@/lib/render-slices";

export interface SplitRequest {
  rects: SliceRect[];
  format: ExportFormat;
  quality: number;
  onProgress?: (done: number, total: number) => void;
}

export interface SplitSession {
  kind: "worker" | "main";
  width: number;
  height: number;
  split: (request: SplitRequest) => Promise<RenderedSlice[]>;
  dispose: () => void;
}

interface WorkerSlice {
  index: number;
  width: number;
  height: number;
  type: string;
  buffer: ArrayBuffer;
}

type WorkerResponse =
  | { type: "loaded"; id: number; width: number; height: number }
  | { type: "done"; id: number; slices: WorkerSlice[] }
  | { type: "progress"; id: number; done: number; total: number }
  | { type: "skipped"; id: number }
  | { type: "cleared"; id: number }
  | { type: "error"; id: number; message: string };

interface Pending {
  resolve: (value: WorkerResponse) => void;
  reject: (error: Error) => void;
  onProgress?: (done: number, total: number) => void;
}

let worker: Worker | null = null;
let workerBroken = false;
let requestId = 0;
let imageGeneration = 0;
const pending = new Map<number, Pending>();

function failPending(message: string) {
  for (const entry of pending.values()) {
    entry.reject(new Error(message));
  }
  pending.clear();
}

function canUseWorker(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    !workerBroken
  );
}

function ensureWorker(): Worker | null {
  if (!canUseWorker()) return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL("../workers/split.worker.ts", import.meta.url));
  } catch {
    workerBroken = true;
    return null;
  }

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event.data;
    if (data.type === "progress") {
      pending.get(data.id)?.onProgress?.(data.done, data.total);
      return;
    }
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);
    if (data.type === "error") entry.reject(new Error(data.message));
    else if (data.type === "skipped") entry.reject(new DOMException("Aborted", "AbortError"));
    else entry.resolve(data);
  };

  worker.onerror = () => {
    workerBroken = true;
    worker?.terminate();
    worker = null;
    failPending("The image worker stopped. Trying again on this page.");
  };

  return worker;
}

function send(
  target: Worker,
  message: unknown,
  transfer?: Transferable[],
  onProgress?: (done: number, total: number) => void,
): Promise<WorkerResponse> {
  const id = (message as { id: number }).id;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    try {
      target.postMessage(message, transfer ?? []);
    } catch (error) {
      pending.delete(id);
      reject(error instanceof Error ? error : new Error("Could not start the image worker."));
    }
  });
}

async function openWorkerSession(file: File): Promise<SplitSession | null> {
  const target = ensureWorker();
  if (!target) return null;

  const generation = ++imageGeneration;
  const id = ++requestId;
  const buffer = await file.arrayBuffer();
  const response = await send(
    target,
    {
      type: "load",
      id,
      generation,
      buffer,
      mime: file.type || "image/png",
    },
    [buffer],
  );
  if (response.type !== "loaded") {
    throw new Error("Could not read this image.");
  }

  const width = response.width;
  const height = response.height;

  return {
    kind: "worker",
    width,
    height,
    dispose: () => {
      const live = worker;
      if (!live || workerBroken) return;
      const clearId = ++requestId;
      void send(live, { type: "clear", id: clearId, generation }).catch(() => undefined);
    },
    split: async (request) => {
      const live = ensureWorker();
      if (!live) {
        throw new Error("The image worker is unavailable.");
      }
      const splitId = ++requestId;
      const response = await send(
        live,
        {
          type: "split",
          id: splitId,
          generation,
          rects: request.rects,
          format: request.format,
          quality: request.quality,
        },
        undefined,
        request.onProgress,
      );
      if (response.type !== "done") {
        throw new Error("The split did not finish.");
      }
      return response.slices
        .sort((a, b) => a.index - b.index)
        .map((slice) => ({
          index: slice.index,
          width: slice.width,
          height: slice.height,
          blob: new Blob([slice.buffer], { type: slice.type || "image/png" }),
        }));
    },
  };
}

async function createBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

async function openMainSession(file: File): Promise<SplitSession> {
  const bitmap = await createBitmap(file);
  let active = 0;

  return {
    kind: "main",
    width: bitmap.width,
    height: bitmap.height,
    dispose: () => {
      active += 1;
      bitmap.close();
    },
    split: (request) => {
      const job = ++active;
      return renderSlices(bitmap, request.rects, request.format, request.quality, {
        onProgress: request.onProgress,
        shouldContinue: () => job === active,
      });
    },
  };
}

export async function openSplitSession(file: File): Promise<SplitSession> {
  if (canUseWorker()) {
    try {
      const session = await openWorkerSession(file);
      if (session) return session;
    } catch (error) {
      if (isAbortError(error) || !workerBroken) throw error;
    }
  }
  return openMainSession(file);
}

export async function openMainSplitSession(file: File): Promise<SplitSession> {
  return openMainSession(file);
}
