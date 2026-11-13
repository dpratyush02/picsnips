import type { SliceRect } from "@/lib/geometry";

export type ExportFormat = "png" | "jpeg";

export interface RenderedSlice {
  index: number;
  width: number;
  height: number;
  blob: Blob;
}

interface DrawContext {
  imageSmoothingEnabled: boolean;
  fillStyle: string;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  drawImage: (
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => void;
}

function makeCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    (canvas as HTMLCanvasElement).toBlob((result) => resolve(result), type, quality);
  });
  if (!blob) {
    throw new Error("This browser could not export a slice. Try a smaller image.");
  }
  return blob;
}

function yieldFrame(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Copy each rectangle 1:1 from the decoded bitmap.
 * Nothing is scaled. JPEG flattens transparency onto white; PNG stays lossless.
 */
export async function renderSlices(
  bitmap: ImageBitmap,
  rects: SliceRect[],
  format: ExportFormat,
  quality: number,
  hooks?: {
    onProgress?: (done: number, total: number) => void;
    shouldContinue?: () => boolean;
  },
): Promise<RenderedSlice[]> {
  const type = format === "jpeg" ? "image/jpeg" : "image/png";
  const jpegQuality = Math.min(1, Math.max(0.5, quality));
  const slices: RenderedSlice[] = [];

  for (let index = 0; index < rects.length; index += 1) {
    if (hooks?.shouldContinue && !hooks.shouldContinue()) {
      throw new DOMException("Aborted", "AbortError");
    }

    const rect = rects[index];
    const canvas = makeCanvas(rect.sw, rect.sh);
    const context = canvas.getContext("2d") as DrawContext | null;
    if (!context) {
      throw new Error("Canvas is unavailable in this browser.");
    }

    context.imageSmoothingEnabled = false;
    if (format === "jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, rect.sw, rect.sh);
    }
    context.drawImage(
      bitmap,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      0,
      0,
      rect.sw,
      rect.sh,
    );

    const blob = await canvasToBlob(
      canvas,
      type,
      format === "jpeg" ? jpegQuality : undefined,
    );
    slices.push({
      index: rect.index,
      width: rect.sw,
      height: rect.sh,
      blob,
    });
    hooks?.onProgress?.(index + 1, rects.length);

    if (index < rects.length - 1) {
      await yieldFrame();
    }
  }

  return slices;
}
