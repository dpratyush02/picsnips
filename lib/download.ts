import JSZip from "jszip";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

export function downloadBlobs(files: { blob: Blob; name: string }[]): void {
  for (const file of files) downloadBlob(file.blob, file.name);
}

export async function zipPieces(
  files: { blob: Blob; name: string }[],
  orderNote: string,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.blob);
  zip.file("order.txt", orderNote);
  return zip.generateAsync(
    { type: "blob", compression: "STORE" },
    (update) => onProgress?.(update.percent),
  );
}

export function orderNote(details: {
  count: number;
  rows: number;
  cols: number;
  width: number;
  height: number;
  format: string;
  names: string[];
}): string {
  const layout =
    details.rows === 1
      ? "vertical strips, left to right"
      : details.cols === 1
        ? "horizontal strips, top to bottom"
        : `${details.rows} rows × ${details.cols} columns, left to right then top to bottom`;

  return [
    "PicSnips",
    "",
    "Upload these files to X in numeric order, starting with 01.",
    "The composer will not attach them for you.",
    "X may crop or rearrange the post preview; these files are the full slices.",
    "",
    `Pieces: ${details.count}`,
    `Order: ${layout}`,
    `Original: ${details.width}×${details.height}`,
    `Format: ${details.format.toUpperCase()}`,
    "",
    ...details.names,
    "",
  ].join("\n");
}
