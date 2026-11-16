// Reusable radix-2 FFT tables. The inverse is intentionally unscaled.
export function createTransform(length: number) {
  const bitReversed = Uint16Array.from({length}, (_, i) => {
    let value = 0;
    for (let n = i, size = length; size > 1; n >>= 1, size >>= 1) value = (value << 1) | (n & 1);
    return value;
  });
  const cos = Float64Array.from({length: length / 2}, (_, i) => Math.cos(-2 * Math.PI * i / length));
  const sin = Float64Array.from(cos, (_, i) => Math.sin(-2 * Math.PI * i / length));

  return (real: Float64Array, imaginary: Float64Array, inverse = false) => {
    for (let i = 0; i < length; i++) {
      const j = bitReversed[i];
      if (j <= i) continue;
      const re = real[i], im = imaginary[i];
      real[i] = real[j];
      imaginary[i] = imaginary[j];
      real[j] = re;
      imaginary[j] = im;
    }
    for (let size = 2; size <= length; size *= 2) {
      const half = size / 2, stride = length / size;
      for (let start = 0; start < length; start += size) {
        for (let j = 0; j < half; j++) {
          const a = start + j, b = a + half, phase = j * stride;
          const sine = inverse ? -sin[phase] : sin[phase];
          const re = real[b] * cos[phase] - imaginary[b] * sine;
          const im = real[b] * sine + imaginary[b] * cos[phase];
          real[b] = real[a] - re;
          imaginary[b] = imaginary[a] - im;
          real[a] += re;
          imaginary[a] += im;
        }
      }
    }
  };
}

export const FFT_SIZE = 2048;
export const hann = Float64Array.from({length: FFT_SIZE}, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / FFT_SIZE));
export const transform = createTransform(FFT_SIZE);
