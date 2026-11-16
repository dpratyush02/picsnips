import { FRAME, MAX_NOISE_CONTRAST_DB, NOISE_FLOOR_MIN_DB, percentile, type Diagnostics } from './diagnostics.ts';
import { FFT_SIZE, hann, transform } from './spectrum.ts';

const HOP = FFT_SIZE / 2;
const window = hann.map(Math.sqrt);
const BINS = HOP + 1;

// Use only quiet spans that agree with the recording's median pause level.
// Exclude transitions and require several separate quiet spans so a single
// breath or tail cannot become the noise profile for the whole recording.
export function learnNoisePrint(samples: Float32Array, info: Diagnostics) {
  if (info.activityConfidence < .6 || info.quietDb === null || info.quietDb <= NOISE_FLOOR_MIN_DB ||
      info.approximateSnr === null || info.approximateSnr >= MAX_NOISE_CONTRAST_DB) return null;
  const noiseLevel = info.quietDb;
  const windows: number[] = [];
  let runs = 0;
  let inRun = false;
  for (let i = 1; i + 1 < info.frames.length; i++) {
    const start = i * FRAME - (FFT_SIZE - FRAME) / 2;
    if (start + FFT_SIZE > samples.length) break;
    const quiet = [info.frames[i - 1], info.frames[i], info.frames[i + 1]]
      .every(frame => frame.quiet && Math.abs(frame.db - noiseLevel) <= 5);
    if (quiet) {
      if (!inRun) runs++;
      windows.push(start);
    }
    inRun = quiet;
  }
  if (runs < 2 || windows.length < 8) return null;

  const real = new Float64Array(FFT_SIZE), imaginary = new Float64Array(FFT_SIZE);
  const powers = Array.from({length: BINS}, () => [] as number[]);
  const stride = Math.ceil(windows.length / 128);
  for (let i = 0; i < windows.length; i += stride) {
    imaginary.fill(0);
    for (let j = 0; j < FFT_SIZE; j++) real[j] = samples[windows[i] + j] * window[j];
    transform(real, imaginary);
    for (let bin = 0; bin < BINS; bin++) powers[bin].push(real[bin] ** 2 + imaginary[bin] ** 2);
  }
  // Reject nonpersistent energies by using a robust per-bin median scaled
  // for the power of Gaussian noise. Tonal fan noise stays in the profile.
  return Float64Array.from(powers, bin => percentile(bin, .5) * 1.35);
}

export function reduceProfileNoise(samples: Float32Array, profile: Float64Array, progress?: (fraction: number) => void) {
  const real = new Float64Array(FFT_SIZE), imaginary = new Float64Array(FFT_SIZE);
  const gain = new Float64Array(BINS).fill(1);
  const result = new Float32Array(samples.length);
  for (let start = -HOP; start < samples.length; start += HOP) {
    imaginary.fill(0);
    for (let i = 0; i < FFT_SIZE; i++) real[i] = (samples[start + i] ?? 0) * window[i];
    transform(real, imaginary);
    for (let bin = 0; bin < BINS; bin++) {
      const power = real[bin] ** 2 + imaginary[bin] ** 2;
      const requested = Math.sqrt(Math.max(.18 ** 2, 1 - 1.35 * profile[bin] / Math.max(1e-10, power)));
      // Open quickly for speech onset and close more gradually to limit
      // abrupt changes in background texture.
      gain[bin] += (requested > gain[bin] ? .84 : .56) * (requested - gain[bin]);
      real[bin] *= gain[bin];
      imaginary[bin] *= gain[bin];
      if (bin === 0 || bin === HOP) continue;
      real[FFT_SIZE - bin] *= gain[bin];
      imaginary[FFT_SIZE - bin] *= gain[bin];
    }
    transform(real, imaginary, true);
    // Square-root Hann analysis/synthesis windows sum to one at half overlap.
    for (let i = Math.max(0, -start); i < Math.min(FFT_SIZE, samples.length - start); i++) {
      result[start + i] += real[i] * window[i] / FFT_SIZE;
    }
    if ((start / HOP) % 48 === 0) progress?.(Math.min(1, (start + HOP) / samples.length));
  }
  progress?.(1);
  return result;
}
