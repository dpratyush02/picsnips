export { MAX_PIECES, MIN_PIECES } from "@/lib/geometry";

/** Reject files the browser is unlikely to decode and slice comfortably. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** Still accepted, but the UI warns that slicing may take a moment. */
export const WARN_FILE_BYTES = 12 * 1024 * 1024;

export const MAX_DIMENSION = 16_384;

/** About 32 megapixels. Above this, mobile browsers often fail canvas export. */
export const MAX_PIXELS = 32_000_000;

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type AcceptedType = (typeof ACCEPTED_TYPES)[number];
