import type { CaptureResult, PostHog } from "posthog-js";

type AnalyticsEvent =
  | "file_selected" | "file_loaded" | "file_failed" | "file_cancelled" | "file_removed"
  | "processing_started" | "processing_completed" | "processing_failed" | "processing_cancelled"
  | "export_started" | "export_completed" | "export_failed" | "export_cancelled"
  | "download_requested" | "comparison_switched"
  | "x_composer_opened" | "x_composer_blocked"
  | "sponsor_checkout_started" | "sponsor_checkout_opened" | "sponsor_checkout_failed";

export type AnalyticsProperties = {
  operation?: "load" | "split" | "extract" | "enhance" | "export";
  media_type?: "image" | "audio" | "video" | "gif" | "sequence";
  format?: string;
  file_size_mb?: number;
  file_count?: number;
  duration_seconds?: number;
  elapsed_ms?: number;
  width?: number;
  height?: number;
  count?: number;
  rows?: number;
  cols?: number;
  mode?: string;
  resolution?: string;
  comparison?: "original" | "enhanced";
  http_status?: number;
  reason?: "unsupported_format" | "empty_file" | "file_too_large" | "dimensions" | "decode_failed";
};

let initialization: Promise<PostHog | null> | undefined;

function toolForPath(path: string) {
  switch (path) {
    case "/split": return "image_splitter";
    case "/tools/scroll-animation": return "scroll_animation";
    case "/tools/voice-enhancer": return "voice_enhancer";
    case "/sponsors": return "sponsors";
    default: return "website";
  }
}

function withoutQuery(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export function sanitizeAnalyticsEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;
  const properties = { ...event.properties };
  // URLs can contain library filenames, image URLs, captions, or checkout IDs.
  for (const key of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"]) {
    if (typeof properties[key] === "string") properties[key] = withoutQuery(properties[key]);
  }
  delete properties.$set;
  delete properties.$set_once;
  const sanitized = { ...event, properties };
  delete sanitized.$set;
  delete sanitized.$set_once;
  return sanitized;
}

function getPostHog(): Promise<PostHog | null> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (typeof window === "undefined" || !key) return Promise.resolve(null);
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (privacy.globalPrivacyControl || navigator.doNotTrack === "1" || navigator.doNotTrack === "yes") {
    return Promise.resolve(null);
  }

  initialization ??= import("posthog-js").then(({ default: posthog }) => {
    return posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
      persistence: "localStorage",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_exceptions: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_conversations: true,
      disable_product_tours: true,
      disable_external_dependency_loading: true,
      advanced_disable_feature_flags: true,
      save_campaign_params: false,
      save_referrer: false,
      respect_dnt: true,
      before_send: sanitizeAnalyticsEvent,
    }) ?? null;
  }).catch(() => null);
  return initialization;
}

function capture(event: string, properties: Record<string, unknown>, path: string) {
  if (typeof window === "undefined") return;
  const context = {
    ...properties,
    tool: toolForPath(path),
    $current_url: `${window.location.origin}${path}`,
    $pathname: path,
  };
  // Secondary analytics must never interrupt a media operation or download.
  void getPostHog().then(client => client?.capture(event, context)).catch(() => {});
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  const properties: Record<string, unknown> = {
    $referrer: withoutQuery(document.referrer),
  };
  try {
    properties.$referring_domain = new URL(document.referrer).hostname;
  } catch {}
  const params = new URLSearchParams(window.location.search);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = params.get(key);
    if (value) properties[key] = value.slice(0, 200);
  }
  capture("$pageview", properties, path);
}

export function trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  capture(event, properties, window.location.pathname);
}
