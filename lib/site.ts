export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://picsnips.site"
).replace(/\/$/, "");

export const siteName = "PicSnips";

export const defaultCaption = "One image. Twenty pieces.";

export const maxCaptionLength = 280;

export const seoDescription =
  "Split any image into 20 parts for a panoramic X (Twitter) post. Free 20 image X post maker and Twitter image splitter. No upload — it runs in your browser.";
