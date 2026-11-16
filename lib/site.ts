export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.picsnips.site"
).replace(/\/$/, "");

export const siteName = "PicSnips";

export const defaultCaption = "One image. Twenty pieces.";

export const maxCaptionLength = 280;

export const seoDescription =
  "Free browser-based creative tools. Split an image into up to 20 tiles for X, turn a video or GIF into frames, and explore a curated image library. No signup required.";
