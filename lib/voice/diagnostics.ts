import { SAMPLE_RATE } from './dsp.ts';
import { clamp, integratedLoudness, toDb } from './metering.ts';

import { FFT_SIZE, hann, transform } from './spectrum.ts';

export const FRAME = 1920; // 40 ms
export const NOISE_FLOOR_MIN_DB = -64;
export const MAX_NOISE_CONTRAST_DB = 42;

function spectrumReader() {
  const real = new Float64Array(FFT_SIZE), imaginary = new Float64Array(FFT_SIZE);
  return (samples: Float32Array, offset: number) => {
    imaginary.fill(0);
    for (let i = 0; i < FFT_SIZE; i++) real[i] = (samples[offset + i] ?? 0) * hann[i];
    transform(real, imaginary);
    const bands = {low: 0, body: 0, mud: 0, mids: 0, presence: 0, sibilance: 0, high: 0};
    for (let i = 1; i < FFT_SIZE / 2; i++) {
      const hz = i * SAMPLE_RATE / FFT_SIZE;
      const power = real[i] ** 2 + imaginary[i] ** 2;
      if (hz < 90) bands.low += power;
      else if (hz < 250) bands.body += power;
      else if (hz < 600) bands.mud += power;
      else if (hz < 1800) bands.mids += power;
      else if (hz < 4500) bands.presence += power;
      else if (hz < 8500) bands.sibilance += power;
      else if (hz < 14000) bands.high += power;
    }
    return bands;
  };
}

export type Issue = { confidence: number; level: number };
export type IssueName = 'noise' | 'rumble' | 'hum' | 'mud' | 'dull' | 'harsh' | 'sibilance' | 'variation' | 'clipping' | 'reverb' | 'overlap';
export type Diagnostics = {
  frames: { db: number; active: boolean; quiet: boolean }[];
  activityConfidence: number;
  loudness: number | null;
  samplePeak: number;
  approximateSnr: number | null;
  quietDb: number | null;
  issues: Record<IssueName, Issue>;
};
export const percentile = (values: number[], p: number) => {
  if (!values.length) return -160;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)];
};

// Compare phrase-level levels so normal vowel and consonant variation does
// not, by itself, trigger compression.
export function voiceSpread(levels: readonly (number | null)[]) {
  const phrases: number[] = [];
  for (let start = 0; start < levels.length; start += 10) {
    const speech = levels.slice(start, start + 10).filter(level => level !== null);
    if (speech.length >= 4) phrases.push(percentile(speech, .5));
  }
  return phrases.length >= 6 ? percentile(phrases, .9) - percentile(phrases, .15) : 0;
}

function humAt(samples: Float32Array, start: number, hz: number) {
  const size = FRAME * 5;
  const factor = 2 * Math.cos(2 * Math.PI * hz / SAMPLE_RATE);
  let previous = 0, prior = 0;
  for (let i = 0; i < size; i++) {
    const next = samples[start + i] + factor * previous - prior;
    prior = previous;
    previous = next;
  }
  return Math.max(0, previous ** 2 + prior ** 2 - factor * previous * prior);
}

export function analyze(samples: Float32Array): Diagnostics {
  let samplePeak = 0, nearFullScale = 0;
  const levels: number[] = [];
  for (let start = 0; start < samples.length; start += FRAME) {
    let square = 0;
    const size = Math.min(FRAME, samples.length - start);
    for (let i = start; i < start + size; i++) {
      const value = Math.abs(samples[i]);
      if (!Number.isFinite(value)) throw new Error('The recording contains invalid samples.');
      samplePeak = Math.max(samplePeak, value);
      if (value >= .999) nearFullScale++;
      square += value * value;
    }
    levels.push(toDb(Math.sqrt(square / size)));
  }
  const low = percentile(levels, .16), high = percentile(levels, .88);
  const gap = high - low;
  const activeThreshold = Math.max(-76, high - 22, low + Math.min(10, gap * .55));
  const quietThreshold = Math.min(low + 5, activeThreshold - 4);
  const frames = levels.map(db => ({db, active: db >= activeThreshold, quiet: db <= quietThreshold}));
  const active = frames.filter(f => f.active);
  const quiet = frames.filter(f => f.quiet);
  const readSpectrum = spectrumReader();
  let activeScans = 0, quietScans = 0, lowQuiet = 0, body = 0, mud = 0, mids = 0, presence = 0, sibHits = 0;
  const stride = Math.max(1, Math.ceil(frames.length / 700));
  for (let i = 0; i < frames.length; i += stride) {
    const frame = frames[i];
    if (!frame.active && (!frame.quiet || frame.db < -78)) continue;
    const bands = readSpectrum(samples, i * FRAME);
    const sum = Object.values(bands).reduce((a, b) => a + b, 1e-10);
    if (frame.active) {
      activeScans++;
      body += bands.body / sum;
      mud += bands.mud / sum;
      mids += bands.mids / sum;
      presence += bands.presence / sum;
      if (bands.sibilance / sum > .42 && bands.high / sum < .25) sibHits++;
    } else {
      quietScans++;
      lowQuiet += bands.low / sum;
    }
  }
  const voiceBands = (body + mud + mids + presence) / Math.max(1, activeScans);
  const activityConfidence = high > -76 && activeScans >= 6 && voiceBands > .5
    ? clamp((gap - 6) / 15, 0, 1) * clamp(activeScans / 16, 0, 1)
    : 0;
  const quietDb = quiet.length >= 6 ? percentile(quiet.map(f => f.db), .5) : null;
  const approximateSnr = quietDb !== null && activityConfidence >= .6 ? percentile(active.map(f => f.db), .5) - quietDb : null;
  let humWindows = 0, hum50 = 0, hum60 = 0;
  for (let i = 0; i + 5 <= frames.length && humWindows < 24; i += 5) {
    if (!frames.slice(i, i + 5).every(f => f.quiet && f.db > -66)) continue;
    humWindows++;
    const start = i * FRAME;
    if (start + 5 * FRAME > samples.length) break;
    const p50 = humAt(samples, start, 50), p60 = humAt(samples, start, 60);
    const flank = Math.max(humAt(samples, start, 40), humAt(samples, start, 70), 1e-8);
    if (p50 > 6 * Math.max(p60, flank)) hum50++;
    if (p60 > 6 * Math.max(p50, flank)) hum60++;
  }

  // Envelope tails can be caused by pauses, music or noise. Never act on this estimate.
  let tails = 0, falling = 0;
  for (let i = 2; i + 4 < frames.length; i++) {
    if (!frames[i - 1].active || !frames[i].active || frames[i + 1].active || frames[i + 4].active) continue;
    tails++;
    if (levels[i + 1] - levels[i + 4] > 9 && levels[i + 4] >= low + 4 &&
        levels[i + 1] > levels[i + 2] && levels[i + 2] > levels[i + 3]) falling++;
  }
  const tonalConfidence = activeScans >= 20 ? activityConfidence * .8 : 0;
  const variation = voiceSpread(frames.map(frame => frame.active ? frame.db : null));
  return {
    frames, activityConfidence, samplePeak, quietDb, approximateSnr,
    loudness: integratedLoudness(samples),
    issues: {
      noise: {confidence: approximateSnr !== null && quietDb! > NOISE_FLOOR_MIN_DB && approximateSnr < MAX_NOISE_CONTRAST_DB ? activityConfidence : 0, level: approximateSnr ?? 0},
      rumble: {confidence: quietScans >= 6 && lowQuiet / quietScans > .55 && quietDb !== null && quietDb > -61 ? activityConfidence : 0, level: lowQuiet / Math.max(1, quietScans)},
      hum: {confidence: Math.max(hum50, hum60) >= 3 && Math.max(hum50, hum60) / humWindows >= .7 ? .85 : 0, level: hum50 > hum60 ? 50 : 60},
      mud: {confidence: mud > 1.9 * (mids + presence) ? tonalConfidence : 0, level: mud / Math.max(1, activeScans)},
      dull: {confidence: mids > .12 * activeScans && presence < .038 * activeScans ? tonalConfidence : 0, level: presence / Math.max(1, activeScans)},
      harsh: {confidence: presence > .38 * activeScans ? tonalConfidence : 0, level: presence / Math.max(1, activeScans)},
      sibilance: {confidence: sibHits >= 3 && sibHits / activeScans < .3 ? tonalConfidence : 0, level: sibHits / Math.max(1, activeScans)},
      variation: {confidence: variation > 13 && active.length >= 20 ? activityConfidence : 0, level: variation},
      clipping: {confidence: nearFullScale >= 3 ? 1 : 0, level: nearFullScale},
      reverb: {confidence: tails >= 3 ? .35 * falling / tails : 0, level: falling},
      // A mono energy/spectral scan cannot reliably tell polyphony from harmonics.
      overlap: {confidence: 0, level: 0},
    },
  };
}
