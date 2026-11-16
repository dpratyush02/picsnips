export const SAMPLE_RATE = 48000;
export type VoiceSettings = { mode: 'clean' | 'studio' | 'custom'; strength: number; clarity: number; loudness: number };
export function validateSettings(s: VoiceSettings) {
  if (!['clean', 'studio', 'custom'].includes(s.mode) || !Number.isFinite(s.strength) || s.strength < 0 || s.strength > 100 || !Number.isFinite(s.clarity) || s.clarity < 0 || s.clarity > 6 || !Number.isFinite(s.loudness) || s.loudness < -12 || s.loudness > 12) throw new Error('Invalid enhancement settings.');
}
// Delay must be measured/confirmed for the exact bundled model, never guessed.
export function compensate(raw: Float32Array, length: number, delay: number) {
  if (!Number.isInteger(delay) || delay < 0 || raw.length < length + delay) throw new Error('Invalid model delay or incomplete output.');
  return raw.subarray(delay, delay + length);
}
export function finishVoice(wet: Float32Array, dry: Float32Array, settings: VoiceSettings) {
  validateSettings(settings);
  if (wet.length !== dry.length) throw new Error('Audio length changed during inference.');
  const strength = settings.mode === 'custom' ? settings.strength / 100 : settings.mode === 'studio' ? 1 : .9;
  const clarity = settings.mode === 'studio' ? 2 : settings.mode === 'custom' ? settings.clarity : 0;
  // RBJ peaking EQ, 2.5 kHz, Q=.7. Neural inference always precedes this stage.
  const a = Math.pow(10, clarity / 40), omega = 2 * Math.PI * 2500 / SAMPLE_RATE;
  const alpha = Math.sin(omega) / (2 * .7), a0 = 1 + alpha / a;
  const b0 = (1 + alpha * a) / a0, b1 = -2 * Math.cos(omega) / a0, b2 = (1 - alpha * a) / a0;
  const a1 = -2 * Math.cos(omega) / a0, a2 = (1 - alpha / a) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, envelope = 0, sum = 0;
  const out = new Float32Array(wet.length);
  const attack = Math.exp(-1 / (.005 * SAMPLE_RATE)), release = Math.exp(-1 / (.12 * SAMPLE_RATE));
  for (let i = 0; i < out.length; i++) {
    if (!Number.isFinite(wet[i]) || !Number.isFinite(dry[i])) throw new Error('The audio engine produced invalid samples.');
    const x = dry[i] * (1 - strength) + wet[i] * strength;
    let y = clarity === 0 ? x : b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    if (settings.mode === 'studio') {
      const coeff = Math.abs(y) > envelope ? attack : release;
      envelope = coeff * envelope + (1 - coeff) * Math.abs(y);
      const db = 20 * Math.log10(Math.max(envelope, 1e-9));
      if (db > -18) y *= Math.pow(10, ((-18 + (db + 18) / 2.5) - db) / 20);
    }
    out[i] = y; sum += y * y;
  }
  // Bounded RMS normalization, explicitly not LUFS mastering. Do not amplify silence.
  const rms = Math.sqrt(sum / Math.max(1, out.length));
  const gain = settings.mode === 'studio' && rms > .0001 ? Math.min(Math.pow(10, 12 / 20), .1259 / rms) : settings.mode === 'custom' ? Math.pow(10, settings.loudness / 20) : 1;
  // Soft knee peak limiter: continuous below/above threshold, bounded to -1 dBFS.
  const ceiling = Math.pow(10, -1 / 20), knee = .75;
  for (let i = 0; i < out.length; i++) {
    const x = out[i] * gain, abs = Math.abs(x);
    out[i] = abs <= knee ? x : Math.sign(x) * (knee + (ceiling - knee) * Math.tanh((abs - knee) / (ceiling - knee)));
  }
  return out;
}
export function wavBytes(samples: Float32Array, bits: 16 | 24 = 16) {
  const bytes = bits / 8;
  const dataSize = samples.length * bytes;
  const buffer = new ArrayBuffer(44 + dataSize + dataSize % 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, SAMPLE_RATE, true); view.setUint32(28, SAMPLE_RATE * bytes, true); view.setUint16(32, bytes, true); view.setUint16(34, bits, true); text(36, 'data'); view.setUint32(40, samples.length * bytes, true);
  samples.forEach((sample, i) => {
    if (!Number.isFinite(sample)) throw new Error('Cannot encode invalid audio.');
    const x = Math.max(-1, Math.min(1, sample)), integer = Math.round(x * (x < 0 ? 2 ** (bits - 1) : 2 ** (bits - 1) - 1)), offset = 44 + i * bytes;
    if (bits === 16) view.setInt16(offset, integer, true);
    else { view.setUint8(offset, integer & 255); view.setUint8(offset + 1, (integer >> 8) & 255); view.setUint8(offset + 2, (integer >> 16) & 255); }
  });
  return buffer;
}
export function waveform(samples: Float32Array, bars = 240) {
  const peaks = new Array<number>(Math.min(bars, samples.length)).fill(0);
  for (let i = 0; i < samples.length; i++) { const bin = Math.min(peaks.length - 1, Math.floor(i * peaks.length / samples.length)); peaks[bin] = Math.max(peaks[bin], Math.abs(samples[i])); }
  return peaks;
}
