import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compensate, finishVoice, validateSettings, wavBytes, waveform, type VoiceSettings} from './dsp.ts';
import {isRuntimeManifest} from './runtime.ts';

const custom: VoiceSettings = {mode: 'custom', strength: 100, clarity: 0, loudness: 0};

test('engine delay compensation keeps exact sample length including partial frames', () => {
  assert.deepEqual(compensate(Float32Array.of(0, 0, .25, -.5, .75, 0), 3, 2), Float32Array.of(.25, -.5, .75));
  assert.throws(() => compensate(Float32Array.of(0), 2, 1), /incomplete/);
});

test('custom mix, gain and vocal EQ change the signal independently', () => {
  const wet = Float32Array.from({length: 480}, (_, i) => .15 * Math.sin(i * Math.PI * 2500 / 24000));
  const dry = wet.map(value => value * 2);
  assert.deepEqual(finishVoice(wet, dry, custom), wet);
  assert.deepEqual(finishVoice(wet, dry, {...custom, strength: 0}), dry);
  const gained = finishVoice(wet, dry, {...custom, loudness: 6});
  assert.ok(Math.abs(gained[5] / wet[5] - 10 ** .3) < 1e-5);
  const clarified = finishVoice(wet, dry, {...custom, clarity: 6});
  assert.ok(Math.abs(clarified[451] / wet[451] - 10 ** .3) < .01);
});

test('studio mode normalizes quiet input and never introduces audio into silence', () => {
  const quiet = Float32Array.from({length: 4800}, (_, i) => .01 * Math.sin(i * Math.PI * 220 / 24000));
  const studio = {...custom, mode: 'studio'} as const;
  const result = finishVoice(quiet, quiet, studio);
  assert.ok(Math.max(...result) > .03);
  assert.deepEqual(finishVoice(new Float32Array(480), new Float32Array(480), studio), new Float32Array(480));
});

test('peak limiter keeps headroom and invalid inference fails', () => {
  const out = finishVoice(Float32Array.of(1, -1, .1), Float32Array.of(1, -1, .1), {...custom, loudness: 12});
  assert.ok(out.every(value => Math.abs(value) <= 10 ** (-1 / 20) + 1e-7));
  assert.throws(() => finishVoice(Float32Array.of(NaN), Float32Array.of(0), custom), /invalid samples/);
  assert.throws(() => finishVoice(Float32Array.of(0), Float32Array.of(0, 1), custom), /length/);
  assert.throws(() => validateSettings({...custom, loudness: -100}), /Invalid/);
});

test('16 and 24 bit downloads carry valid mono PCM headers and signed samples', () => {
  for (const bits of [16, 24] as const) {
    const samples = Float32Array.of(-1, 0, .5, 1);
    const buffer = wavBytes(samples, bits);
    const header = new DataView(buffer);
    const dataLength = samples.length * bits / 8;
    assert.equal(new TextDecoder().decode(buffer.slice(0, 4)), 'RIFF');
    assert.equal(new TextDecoder().decode(buffer.slice(8, 12)), 'WAVE');
    assert.equal(header.getUint32(4, true), 36 + dataLength);
    assert.equal(header.getUint16(20, true), 1);
    assert.equal(header.getUint16(22, true), 1);
    assert.equal(header.getUint32(24, true), 48000);
    assert.equal(header.getUint16(34, true), bits);
    assert.equal(header.getUint32(40, true), dataLength);
    assert.deepEqual([...new Uint8Array(buffer, 44, bits / 8)], bits === 16 ? [0, 128] : [0, 0, 128]);
  }
  const odd = new DataView(wavBytes(Float32Array.of(.5), 24));
  assert.equal(odd.byteLength, 48);
  assert.equal(odd.getUint32(40, true), 3);
  assert.deepEqual(waveform(Float32Array.of(-.75, .25, 0, .5), 2), [.75, .5]);
});

test('an incomplete or unverified model manifest cannot enable enhancement', () => {
  const manifest = {package: '@lofcz/deepfilternet-web', version: '0.1.0', validated: true, delaySamples: 1440, frameLength: 480, ffmpeg: false};
  assert.ok(isRuntimeManifest(manifest));
  assert.equal(isRuntimeManifest({...manifest, validated: false}), false);
  assert.equal(isRuntimeManifest({...manifest, delaySamples: -1}), false);
  assert.equal(isRuntimeManifest({...manifest, ffmpeg: 'false'}), false);
  assert.equal(isRuntimeManifest(null), false);
});
