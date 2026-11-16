import { SAMPLE_RATE } from './dsp.ts';

export const toDb = (amplitude: number) => 20 * Math.log10(Math.max(amplitude, 1e-8));
export const fromDb = (decibels: number) => 10 ** (decibels / 20);
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type Coefficients = [number, number, number, number, number];
export function biquad([b0, b1, b2, a1, a2]: Coefficients) {
  let z1 = 0;
  let z2 = 0;
  return (input: number) => {
    const output = b0 * input + z1;
    z1 = b1 * input - a1 * output + z2;
    z2 = b2 * input - a2 * output;
    return output;
  };
}

export function filter(kind: 'highpass' | 'lowpass' | 'bandpass' | 'notch' | 'peak', hz: number, q: number, gain = 0) {
  const angle = 2 * Math.PI * hz / SAMPLE_RATE;
  const cos = Math.cos(angle);
  const alpha = Math.sin(angle) / (2 * q);
  const a = fromDb(gain / 2);
  const a0 = kind === 'peak' ? 1 + alpha / a : 1 + alpha;
  const denominator: [number, number] = [-2 * cos / a0, (2 - a0) / a0];
  if (kind === 'peak') return biquad([(1 + alpha * a) / a0, -2 * cos / a0, (1 - alpha * a) / a0, ...denominator]);
  if (kind === 'notch') return biquad([1 / a0, -2 * cos / a0, 1 / a0, ...denominator]);
  if (kind === 'bandpass') return biquad([alpha / a0, 0, -alpha / a0, ...denominator]);
  if (kind === 'lowpass') return biquad([(1 - cos) / (2 * a0), (1 - cos) / a0, (1 - cos) / (2 * a0), ...denominator]);
  return biquad([(1 + cos) / (2 * a0), -(1 + cos) / a0, (1 + cos) / (2 * a0), ...denominator]);
}

// ITU-R BS.1770 mono K-weighting and absolute/relative gating at 48 kHz.
export function integratedLoudness(samples: Float32Array) {
  const shelf = biquad([1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, .73248077421585]);
  const rlb = biquad([1, -2, 1, -1.99004745483398, .99007225036621]);
  const hop = SAMPLE_RATE / 10;
  const blocks: number[] = [];
  let quarter = 0;
  let rolling = 0;
  const history = [0, 0, 0, 0];
  for (let i = 0; i < samples.length; i++) {
    const weighted = rlb(shelf(samples[i]));
    quarter += weighted * weighted;
    if ((i + 1) % hop !== 0) continue;
    const chunk = (i + 1) / hop;
    const slot = (chunk - 1) % 4;
    rolling += quarter - history[slot];
    history[slot] = quarter;
    quarter = 0;
    if (chunk >= 4) blocks.push(Math.max(0, rolling) / (4 * hop));
  }
  const absoluteGate = 10 ** ((-70 + .691) / 10);
  const audible = blocks.filter(power => power > absoluteGate);
  if (!audible.length) return null;
  const relativeGate = audible.reduce((sum, power) => sum + power, 0) / audible.length / 10;
  const gated = audible.filter(power => power >= relativeGate);
  return -.691 + 10 * Math.log10(gated.reduce((sum, power) => sum + power, 0) / gated.length);
}

// Four-phase interpolation with a 24-tap Blackman-windowed sinc. This is a
// true-peak estimate with extra headroom, not a certified broadcast meter.
const radius = 12;
const phases = [.25, .5, .75].map(phase => {
  const weights = Array.from({length: 2 * radius}, (_, i) => {
    const x = i - radius + 1 - phase;
    const window = .42 + .5 * Math.cos(Math.PI * x / radius) + .08 * Math.cos(2 * Math.PI * x / radius);
    return Math.sin(Math.PI * x) / (Math.PI * x) * window;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(weight => weight / sum);
});
const maxPhaseGain = Math.max(...phases.map(weights => weights.reduce((sum, weight) => sum + Math.abs(weight), 0)));

export function estimateTruePeak(samples: Float32Array, knownPeak?: number) {
  let peak = knownPeak ?? 0;
  if (knownPeak === undefined) {
    for (const value of samples) peak = Math.max(peak, Math.abs(value));
  }
  // Skip interpolation for windows whose maximum possible reconstruction
  // cannot reach the largest peak already found.
  const block = 128;
  for (let start = -1; start < samples.length; start += block) {
    const end = Math.min(samples.length, start + block);
    let windowPeak = 0;
    for (let j = Math.max(0, start - radius + 1); j < Math.min(samples.length, end + radius); j++) {
      windowPeak = Math.max(windowPeak, Math.abs(samples[j]));
    }
    if (windowPeak * maxPhaseGain <= peak) continue;
    for (let i = start; i < end; i++) {
      for (const weights of phases) {
        let value = 0;
        for (let tap = 0; tap < weights.length; tap++) {
          value += weights[tap] * (samples[i + tap - radius + 1] ?? 0);
        }
        peak = Math.max(peak, Math.abs(value));
      }
    }
  }
  return peak;
}
