import assert from "node:assert/strict";
import { test } from "node:test";
import { axisRanges, bestGrid, buildLayout } from "./geometry.ts";

test("ranges cover every pixel exactly once", () => {
  for (let total = 2; total <= 400; total += 1) {
    for (let parts = 2; parts <= Math.min(20, total); parts += 1) {
      const ranges = axisRanges(total, parts, "wide");
      assert.equal(ranges.length, parts);
      assert.equal(ranges[0].start, 0);
      let cursor = 0;
      for (const range of ranges) {
        assert.equal(range.start, cursor);
        assert.ok(range.size >= 1);
        cursor += range.size;
      }
      assert.equal(cursor, total);
    }
  }
});

test("remainder pixels are kept on an awkward width", () => {
  const ranges = axisRanges(1001, 20, "wide");
  const sum = ranges.reduce((total, range) => total + range.size, 0);
  assert.equal(sum, 1001);
  assert.ok(ranges.every((range) => range.size === 50 || range.size === 51));
});

test("best grid uses every piece and prefers a wide 20-up layout", () => {
  for (let count = 2; count <= 20; count += 1) {
    const grid = bestGrid(count);
    assert.equal(grid.rows * grid.cols, count);
  }
  assert.deepEqual(bestGrid(20), { rows: 2, cols: 10 });
  assert.deepEqual(bestGrid(12), { rows: 2, cols: 6 });
});

test("slice order is left to right, then top to bottom", () => {
  const layout = buildLayout(1000, 500, 2, 10);
  assert.equal(layout.rects.length, 20);
  assert.equal(layout.rects[0].index, 1);
  assert.equal(layout.rects[0].col, 0);
  assert.equal(layout.rects[0].row, 0);
  assert.equal(layout.rects[9].col, 9);
  assert.equal(layout.rects[10].row, 1);
  assert.equal(layout.rects[10].col, 0);
  const area = layout.rects.reduce((sum, rect) => sum + rect.sw * rect.sh, 0);
  assert.equal(area, 1000 * 500);
});

test("a too-narrow image explains itself", () => {
  assert.throws(() => axisRanges(5, 8, "wide"), /5 pixels wide/);
});
