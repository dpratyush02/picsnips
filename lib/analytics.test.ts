import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeAnalyticsEvent, trackEvent, trackPageView } from "./analytics.ts";
import type { CaptureResult } from "posthog-js";

test("removes private media and checkout data from event URLs", () => {
  const event: CaptureResult = {
    uuid: "test-event",
    event: "$pageview",
    properties: {
      $current_url: "https://www.picsnips.site/split?image=https%3A%2F%2Fprivate.example%2Fphoto.png&name=private-name.png#caption",
      $referrer: "https://www.picsnips.site/sponsors/return?payment_id=private-payment&status=succeeded#private",
      $initial_current_url: "https://www.picsnips.site/?caption=private-caption",
      $initial_referrer: "https://example.com/post?email=private@example.com",
      tool: "image_splitter",
      count: 20,
    },
  };
  const result = sanitizeAnalyticsEvent(event)!;
  assert.equal(result.properties.$current_url, "https://www.picsnips.site/split");
  assert.equal(result.properties.$referrer, "https://www.picsnips.site/sponsors/return");
  assert.equal(result.properties.$initial_current_url, "https://www.picsnips.site/");
  assert.equal(result.properties.$initial_referrer, "https://example.com/post");
  assert.equal(result.properties.tool, "image_splitter");
  assert.equal(result.properties.count, 20);
  assert.match(event.properties.$current_url, /private-name/);
});

test("removes profile properties at both supported payload locations", () => {
  const result = sanitizeAnalyticsEvent({
    uuid: "test-event",
    event: "file_loaded",
    $set: { email: "private@example.com" },
    $set_once: { $initial_current_url: "https://example.com/?private=yes" },
    properties: { $set: { filename: "private.wav" }, $set_once: { caption: "private" }, format: "audio/wav" },
  })!;
  assert.equal(result.$set, undefined);
  assert.equal(result.$set_once, undefined);
  assert.equal(result.properties.$set, undefined);
  assert.equal(result.properties.$set_once, undefined);
  assert.equal(result.properties.format, "audio/wav");
});

test("discards blob, data, and invalid URLs", () => {
  for (const value of ["blob:https://www.picsnips.site/private", "data:image/png;base64,private", "private.wav"]) {
    const result = sanitizeAnalyticsEvent({ uuid: "test-event", event: "$pageview", properties: { $current_url: value } });
    assert.equal(result?.properties.$current_url, "");
  }
  assert.equal(sanitizeAnalyticsEvent(null), null);
});

test("tracking is safe outside the browser", () => {
  assert.doesNotThrow(() => trackEvent("processing_completed", { operation: "enhance", count: 20 }));
  assert.doesNotThrow(() => trackPageView("/split"));
});
