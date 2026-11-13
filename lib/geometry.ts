export const MIN_PIECES = 2;
export const MAX_PIECES = 20;

export interface AxisRange {
  start: number;
  size: number;
}

export interface SliceRect {
  index: number;
  row: number;
  col: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface ImageLayout {
  rects: SliceRect[];
  colRanges: AxisRange[];
  rowRanges: AxisRange[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Split `total` pixels into `parts` contiguous ranges.
 * Rounding boundaries keeps every source pixel in exactly one slice.
 */
export function axisRanges(
  total: number,
  parts: number,
  axis: "wide" | "tall",
): AxisRange[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new Error("Choose a whole number of pieces.");
  }
  if (total < parts) {
    const adjective = axis === "wide" ? "wide" : "tall";
    const suggestion = axis === "wide" ? "wider" : "taller";
    throw new Error(
      `This image is only ${total} pixels ${adjective}. Choose fewer pieces, or use a ${suggestion} image.`,
    );
  }

  const ranges: AxisRange[] = [];
  for (let index = 0; index < parts; index += 1) {
    const start = Math.round((index * total) / parts);
    const end = Math.round(((index + 1) * total) / parts);
    const size = end - start;
    if (size < 1) {
      throw new Error("Could not give every piece at least one pixel.");
    }
    ranges.push({ start, size });
  }

  const covered = ranges[ranges.length - 1].start + ranges[ranges.length - 1].size;
  if (ranges[0].start !== 0 || covered !== total) {
    throw new Error("The slices did not cover the full image.");
  }

  return ranges;
}

/**
 * Pick a rows × columns grid for an exact piece count.
 * Wider layouts win, because panoramic posts read left to right.
 */
export function bestGrid(count: number): { rows: number; cols: number } {
  const safe = clamp(Math.round(count), MIN_PIECES, MAX_PIECES);
  let best = { rows: 1, cols: safe, score: Number.POSITIVE_INFINITY };

  for (let cols = 1; cols <= safe; cols += 1) {
    if (safe % cols !== 0) continue;
    const rows = safe / cols;
    const multi = rows > 1 && cols > 1 ? 0 : 2.5;
    const ratio = cols / rows;
    const ratioScore = Math.abs(Math.log(ratio / 3));
    const skinny = cols < rows ? 0.6 : 0;
    const score = multi + ratioScore + skinny;
    if (score < best.score) best = { rows, cols, score };
  }

  return { rows: best.rows, cols: best.cols };
}

export function computeSlices(
  width: number,
  height: number,
  rows: number,
  cols: number,
): SliceRect[] {
  const colRanges = axisRanges(width, cols, "wide");
  const rowRanges = axisRanges(height, rows, "tall");
  const slices: SliceRect[] = [];
  let index = 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = colRanges[col];
      const y = rowRanges[row];
      slices.push({
        index,
        row,
        col,
        sx: x.start,
        sy: y.start,
        sw: x.size,
        sh: y.size,
      });
      index += 1;
    }
  }

  return slices;
}

export function buildLayout(
  width: number,
  height: number,
  rows: number,
  cols: number,
): ImageLayout {
  return {
    rects: computeSlices(width, height, rows, cols),
    colRanges: axisRanges(width, cols, "wide"),
    rowRanges: axisRanges(height, rows, "tall"),
  };
}

export function spanLabel(values: number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}px` : `${min}–${max}px`;
}

export function pieceSizeLabel(rects: SliceRect[]): string {
  if (rects.length === 0) return "";
  return `${spanLabel(rects.map((rect) => rect.sw))} × ${spanLabel(rects.map((rect) => rect.sh))}`;
}
