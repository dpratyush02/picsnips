# PicSnips Auto Enhance

The new page is `/tools/voice-enhancer`. PicSnips shows its homepage announcement when the verified runtime assets are present at build time. With assets missing, the direct route explains the tool's availability and is marked `noindex`.

## Prepare the runtime

From the existing project, in an environment that can reach npm:

```sh
npm ci
npm test
npm run build:production
```

The Vercel build command prepares DeepFilterNet3 and the single-threaded FFmpeg.wasm runtime before building the site. In development, run `npm run prepare:voice -- --ffmpeg` and then start or restart `next dev`. Omit `--ffmpeg` for browser-native audio input and WAV output. The script stages pinned packages, checks real inference with a synthetic signal and estimates the model delay before writing a manifest. It prints npm archive integrity values and the inference timing. Serve the complete generated `public/voice-assets/` directory from the same origin as PicSnips. The generated assets are ignored by Git, so a fresh deployment checkout must run asset preparation separately. Audio processing has no per-minute service cost. Serving the model and optional encoder incurs ordinary hosting bandwidth.

### Runtime selection and notices

- Selected `@lofcz/deepfilternet-web@0.1.0`. The [package](https://www.npmjs.com/package/@lofcz/deepfilternet-web) documents direct frame processing, a SIMD-enabled WASM build, embedded DeepFilterNet3 weights, and no runtime npm dependencies. The worker invokes this API with 480 samples at 48 kHz per call. The bundled model is loaded on the first enhancement and served with HTTP cache headers.
- [Official DeepFilterNet](https://github.com/Rikorose/DeepFilterNet) is the source of the model and Rust runtime. Its README explicitly covers both code and model weights under a choice of MIT or Apache 2.0. The upstream MIT notice is included. The pretrained DeepFilterNet3 paper is *DeepFilterNet: Perceptually Motivated Real-Time Speech Enhancement*, Schröter, Rosenkranz, Escalante-B. and Maier, Interspeech 2023.
- [DeepFilterNet3.c.wasm](https://github.com/kdrkdrkdr/DeepFilterNet3.c.wasm) documents a model port with separate 8.2 MB weights, Emscripten setup and author-reported timing. Its README identifies KissFFT and model weight terms but does not identify a license for the complete C port. It is not distributed with PicSnips.
- Optional [FFmpeg.wasm](https://ffmpegwasm.netlify.app/docs/overview/) uses `@ffmpeg/ffmpeg@0.12.15` and `@ffmpeg/core@0.12.10`. The wrapper and the core have separate license obligations. The stock core includes GPL components. Before publishing it, include the applicable notices and make corresponding source available under the applicable terms, or use an appropriately licensed custom core that supports the required codecs. Preparation copies notices shipped in the packages. See [FFmpeg.wasm licensing](https://ffmpegwasm.netlify.app/docs/faq/#what-is-the-license-of-ffmpegwasm) and the [upstream source](https://github.com/ffmpegwasm/ffmpeg.wasm).

## Compatibility and workflow

Run over HTTPS or localhost in a browser with WebAssembly SIMD, module workers and Web Audio, such as current Chrome, Edge, Firefox or Safari. Browser codec support varies. A compatible audio file can be decoded with Web Audio. FFmpeg.wasm supports additional codecs and extracts the first audio track from video. Export uses AAC in MP4 or Opus in WebM and copies the video stream. MOV inputs may fail if the original video codec cannot be copied to MP4. Video sources with offset tracks beyond 20 ms are rejected to limit sync errors. The enhanced audio is 48 kHz mono. The 40 MB and two-minute limits reduce memory use on mobile. Video preview also depends on browser codec support.

A/B audio uses the same timeline for the original and enhanced PCM. The editor provides one Auto Enhance action, comparison playback, measured adjustment labels and a primary download. Video defaults to a stream-copy export when compatible. Audio defaults to 24-bit WAV. WAV bit depth, MP3 and encoding bitrate are available in Download settings when applicable. Browser-native decoding can finish after cancellation, in which case its result is discarded.

## How the adaptive engine works

1. The worker measures 40 ms levels, samples FFT spectra across the recording, checks quiet windows for coherent 50/60 Hz energy, estimates foreground activity and pause noise, and measures gated mono K-weighted loudness and sample peaks. Speech activity and SNR are heuristics. Confidence values describe strength of evidence and are not calibrated probabilities. The clipping signal counts near-full-scale samples and cannot establish whether the source clipped earlier.
2. A ruleset chooses bounded parameters from internal Podcast, Voiceover, Interview, Outdoor and conservative baseline profiles. Profile names describe processing settings, not detected content. DeepFilterNet3 loads when quiet-window and speech-like evidence support noise reduction. Its output is aligned using the verified 30 ms model delay. The engine can try a higher proportion of clean audio before stepping down if the preview loses too much voice detail.
3. The worker tests an excerpt of up to eight seconds with representative active and quiet sections. The preview compares normal DeepFilterNet3 with its stronger native post-filter. When several quiet spans support a stable noise footprint, it also tests spectral cleanup on its own and after the stronger neural pass. Residual pause noise can trigger cleanup even in a recording with a relatively clear foreground. The engine favors measured noise reduction while penalizing changes to active speech. Candidate effects are accepted, reduced or skipped in order. Checks include level-independent pause-to-foreground contrast, sample correlation in active frames, measured low-band reduction, and phrase-level spread. These measurements can catch some artifacts and cannot substitute for listening.
4. The approved settings run over the whole recording. Stages available are zero-phase high-pass, narrow hum notch, gentle bounded EQ, band-selective de-essing, limited compression, gated loudness normalization, and global gain trim based on a fourfold intersample peak estimate. Peak protection leaves 1.5 dB of estimated headroom and adds no delay. This is not a standards-certified true-peak meter or a guarantee about the peaks after lossy encoding.
5. The final check validates sample count, finite PCM, peak headroom and the estimated impact on voice. If final checks reject compression or denoising, the engine retries without that effect and retains independently approved corrections when they still pass. The summary reports only measured changes or effects verified to have acted. Nothing is reported as an improvement based on gain alone. The analysis uses a single profile per file and can miss conditions that change between sections.

Possible reverberation is estimated from decay tails at low confidence and triggers no correction. Reliable overlap detection requires a dedicated model. The current engine reports overlap as unassessed and does not run dereverberation or target-speaker isolation.

## Target-speaker isolation research

- [Alkove Focus](https://alkove.ai/docs/models/focus/) is the leading candidate. The publisher documents an Apache-2.0 preview model and SDK, 1.1 MB of int8 Focus weights, a separate Timbre voiceprint model for enrollment, and a browser worker with a file processing API. A clean reference could select the speaker after local audio extraction from an uploaded video. The full download includes additional runtime and models. Its 16 kHz mono output limits speech to 8 kHz bandwidth. The vendor reports improved separation with a voiceprint in competing-voice tests, but also leakage at interfering onsets and target removal when the mic is distant. Published speed figures are native measurements rather than a browser benchmark for PicSnips. Self-hosting is possible, subject to the license notices for the specific package and model versions.
- [WeSep](https://github.com/wenet-e2e/WeSep) provides Apache-2.0 research code and speaker-conditioned extraction recipes. The current repository labels production deployment unsupported and does not establish a production browser path for the current models. A candidate checkpoint would require its own redistribution check and browser inference benchmark.
- Neither option was validated in PicSnips on overlapping human speech. A future prototype should be opt-in, verify retained target intelligibility and naturalness, measure other-speaker leakage on both simultaneous and alternating speech, and check whether bandwidth, memory and latency are acceptable on mobile. No speaker-removal control is exposed.

## Verification status

Automated tests cover timing compensation, DSP and WAV encoding, voice/quiet evidence, noise measurement that is invariant to gain, preview rejection, low-rumble and mains-hum treatment, bounded loudness gain, true-peak estimation, spectral fallback on a fan-like signal, exact spectral reconstruction at the end of a clip, and the existing image splitter geometry. A local Node harness exercised the actual worker, DeepFilterNet3 WASM and the installed FFmpeg WASM core. Controlled fixtures compared Auto Enhance with the old Clean Voice chain on clean vocal-like signals, fan/AC-like noise, low rumble, hum, differing levels, harsh bursts, muffling, echo, overlapping vocal-like signals and music-like mixtures. In those comparisons the auto engine reduced the low rumble and hum cases, preserved the music-like mixture, and used the spectral fallback on the fan-like case. That fixture improved foreground-to-pause contrast by about 8 dB. This is a test measurement, not a claim about every upload. These are objective smoke checks, not human listening or field recordings.

The harness also processed 120 seconds without changing its 5,760,000-sample length and encoded MP3 and MP4 from the public demo. It confirmed the demo export kept the video codec, dimensions, frame count, start time and video duration. The preceding release checks for malformed and silent MP4s are still applicable. A browser/mobile listening comparison against the existing enhancer and representative real recordings are still required before release.

Before enabling the release, run the prepared build in a browser. Listen to clean speech and recordings with fan, traffic, keyboard, music, echo and quiet speech. Try MP3 and WAV, MP4 with and without audio, MOV, WebM and clips at the size/duration limits. Compare A/B timing, scrub and switch tracks while playing, cancel an active job, and confirm a replacement file clears previous output. Inspect exported WAV/MP3 and verify a video with a visible clap stays in sync and retains its dimensions and codec. Verify network requests deliver only static runtime assets and no media. Repeat on desktop Chrome/Firefox/Safari and physical Android/iOS devices. Smoke test `/split` in the same build.

## Changed files

- `app/tools/voice-enhancer/page.tsx` adds the dedicated page, metadata and FAQs.
- `components/voice/` contains the editor and announcement.
- `lib/voice/` handles decode, export, diagnostics, metering, adaptive treatment and tests. `workers/voice.worker.ts` runs analysis, model inference and validation.
- `scripts/prepare-voice-assets.mjs`, `public/voice-licenses/` and `.gitignore` support packaging and attribution.
- `app/page.tsx`, `app/sitemap.ts`, `next.config.ts`, `package.json` and `vercel.json` integrate discovery, cache headers, preparation and tests.
