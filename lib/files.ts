import { ACCEPTED_TYPES, type AcceptedType } from "@/lib/constants";

export type ImageFormat = "png" | "jpeg";

const EXTENSIONS: Record<string, AcceptedType> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function resolveImageType(file: File): AcceptedType | null {
  if (file.type === "image/jpg" || file.type === "image/jpeg") return "image/jpeg";
  if ((ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return file.type as AcceptedType;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS[extension] ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} KB`;
  }
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

export function pieceFilename(index: number, format: ImageFormat): string {
  const extension = format === "jpeg" ? "jpg" : "png";
  return `${String(index).padStart(2, "0")}.${extension}`;
}

export function archiveFilename(count: number, rows: number, cols: number): string {
  const mode = rows === 1 ? "vertical" : cols === 1 ? "horizontal" : "grid";
  return `picsnips-${count}-${mode}.zip`;
}
