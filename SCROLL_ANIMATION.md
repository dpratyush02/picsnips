# Scroll Animation Maker release notes

## Implementation

The five experimental creator tools have been replaced with Scroll Animation Maker at `/tools/scroll-animation`. The image splitter remains at `/split`. The existing homepage hero, image processing, theme system and other established routes are unchanged.

- `app/tools/page.tsx`: tool directory linking the original splitter and new animation tool.
- `app/tools/[tool]/page.tsx`: animation page, metadata and canonical URL; removed experimental tool slugs return 404.
- `app/page.tsx`, `components/scroll/announcement.tsx`: compact feature announcement.
- `components/site-header.tsx`, `app/sitemap.ts`: navigation and discovery.
- `components/scroll/scroll-loader.tsx`: lazy editor loading.
- `components/scroll/scroll-maker.tsx`: upload, range selection, modes, previews, ordering, downloads and caption-only X composer.
- `lib/scroll/{media,extract,plan,gif}.ts`, `workers/gif.worker.ts`: local video seeking, image sequences, frame selection/export and worker-based animated GIF decoding.
- `lib/scroll/scroll.test.ts`, `lib/scroll/fixtures/*`, `public/examples/scroll-sample.gif`: regression tests and reference media.
- `package.json`: includes new tests in the existing test command. No new dependencies.

Supports 2–20 frames; smooth, visual-change, custom and before/after selection; swipe preview, autoplay speed/loop, scrubber, reverse, capped ping-pong and reorder controls. Exports PNG/JPEG/WebP, individual images or ZIP with sequential filenames and an `order.txt` timestamp/dimension manifest. Optional counters are drawn only on exported images. Processing stays local; X receives caption text only and users attach files manually.

## Validation performed

- `npm test`: 12 passed, including existing image geometry, timestamps, ordering, resolution limits, ping-pong limits and GIF reference pixels (disposal modes and LZW dictionary growth).
- `npx tsc --noEmit`: passed.
- `npm run lint`: no errors; three existing image-element warnings outside the new feature.
- `git diff --check`: passed.
- Browser: MP4 sample extracted 20 frames over 0–5 seconds, each frame inspected with chronological decoded timestamps; reverse order checked.
- Browser: animated GIF, changed range, key moments, three custom timestamps, ping-pong cap, counter overlay, PNG ZIP completion and individual JPEG/WebP export paths exercised.
- Browser: autoplay control, desktop layout and 390px mobile light/dark layouts checked. Existing image splitter sample produced 20 downloadable pieces.

## Limits and remaining release checks

- Production build was attempted but Turbopack failed while processing CSS because the execution environment prohibits its subprocess from binding a port (`Operation not permitted`). Run `npm run build` in the normal development/CI environment before deployment.
- Browser-generated ZIP completion was observed, but the automation environment did not expose the downloaded archive for independent inspection. Before release, unzip a real export, verify image signatures/dimensions and compare `order.txt` against the intended sequence.
- Real file-picker uploads, drag/drop reordering, cancellation under heavy load, large-file memory behavior, image-sequence uploads, rotated videos and physical mobile devices still need manual QA. No claim of exhaustive cross-browser testing is made.
- MP4/WebM/MOV support depends on installed browser decoders; MOV is not a codec guarantee. When compositor timestamps are unavailable, displayed seek timestamps are explicitly approximate. Static scenes or short GIFs can legitimately produce identical frames.
- GIF extraction requires workers, OffscreenCanvas and ImageBitmap support. Unsupported decoding produces an error; there is no server fallback. Test current Safari/iOS, Firefox and Chromium before release.
- Conservative limits: videos 150 MB / 5 minutes / 16.6 MP per source frame; GIFs 25 MB / 5 minutes / 1,500 frames / 8.3 MP; sequences 2–20 images, 20 MB each and 40 MP total. Exports cap each frame at 8.3 MP and total encoded results at 120 MB. These limits reduce risk but cannot guarantee memory availability on every device.
- X attachment limits and rendering must be tested with the target accounts. Twenty exported images are a tool preset, not a guarantee that every X account/composer accepts them. PicSnips autoplay is preview-only; exported images contain no audio.

No deployment or automatic X publishing was performed.
