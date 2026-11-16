import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyze} from './diagnostics.ts';
import {choosePlan, choosePreviewPlan, compare, previewRange, renderPlan, validateFinal} from './adaptive.ts';
import {estimateTruePeak, integratedLoudness, toDb} from './metering.ts';
import {learnNoisePrint, reduceProfileNoise} from './noise-print.ts';
import {FFT_SIZE} from './spectrum.ts';

const rate = 48000;
const fixtures = () => {
  let phase = 0;
  let seed = 2345;
  const voice = Float32Array.from({length: rate * 6}, (_, i) => {
    const time = i / rate;
    if (Math.floor(time * 2.5) % 3 === 2) return 0;
    const envelope = Math.max(0, Math.sin(time * 24)) ** .7;
    phase += 2 * Math.PI * (125 + 26 * Math.sin(time * 4) + 20 * Math.sin(time * 14)) / rate;
    return .25 * envelope * (Math.sin(phase) + .45 * Math.sin(3 * phase) + .2 * Math.sin(9 * phase));
  });
  const noise = voice.map(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return .035 * (seed / 0xffffffff - .5);
  });
  return {voice, noise, noisy: voice.map((value, i) => value + noise[i])};
};

test('diagnostics distinguish strong stationary noise from silence and quiet signal', () => {
  const {voice, noise, noisy} = fixtures();
  const diagnosis = analyze(noisy);
  assert.ok(diagnosis.activityConfidence >= .75);
  assert.ok(diagnosis.issues.noise.confidence >= .75);
  assert.ok(diagnosis.approximateSnr !== null && diagnosis.approximateSnr > 15 && diagnosis.approximateSnr < 32);
  assert.equal(choosePlan(analyze(new Float32Array(rate))).wet, 0);
  assert.equal(choosePlan(analyze(noise)).target, null);
  assert.equal(choosePlan(analyze(voice.map(value => value * .04))).wet, 0);
});

test('a relatively clear voice can still have measurable noise worth treating', () => {
  const {voice, noise} = fixtures();
  const residual = voice.map((value, i) => value + .18 * noise[i]);
  const info = analyze(residual);
  assert.ok(info.approximateSnr !== null && info.approximateSnr > 32 && info.approximateSnr < 42);
  assert.ok(choosePlan(info).wet > 0);
  assert.ok(learnNoisePrint(residual, info));
});

test('preview accepts real reduction and rejects level-only or damaging changes', () => {
  const {voice, noisy} = fixtures();
  const input = analyze(noisy);
  const proposed = choosePlan(input);
  const louder = noisy.map(value => value * 2);
  assert.ok(Math.abs(compare(noisy, louder, input).noiseImprovement!) < .01);
  const plan = choosePreviewPlan(noisy, voice, proposed, input);
  assert.ok(plan.wet > 0);
  const result = validateFinal(noisy, voice, plan, input);
  assert.equal(result.samples.length, noisy.length);
  assert.ok(result.actions.includes('noise'));
  assert.ok(compare(noisy, result.samples, input).noiseImprovement! >= 1);
  const destructive = voice.map(value => -value * 3);
  assert.equal(choosePreviewPlan(noisy, destructive, proposed, input).wet, 0);
  assert.ok(!validateFinal(noisy, destructive, plan, input).actions.includes('noise'));
});

test('the steady-noise fallback reduces a fan tone while preserving speech-like activity', () => {
  const {voice, noise} = fixtures();
  const fan = voice.map((sample, i) => sample + .023 * Math.sin(2 * Math.PI * 120 * i / rate) + .5 * noise[i]);
  const info = analyze(fan);
  const profile = learnNoisePrint(fan, info);
  assert.ok(profile);
  const alternate = reduceProfileNoise(fan, profile);
  const plan = choosePreviewPlan(fan, alternate, {...choosePlan(info), wet: .97}, info);
  const out = validateFinal(fan, alternate, plan, info);
  const measured = compare(fan, out.samples, info);
  assert.equal(out.samples.length, fan.length);
  assert.ok(out.actions.includes('noise'));
  assert.ok(measured.noiseImprovement! > 4);
  assert.ok(measured.similarity > .95);
  assert.equal(learnNoisePrint(voice, analyze(voice)), null);
});

test('the spectral pass reconstructs a partial final window without shifting samples', () => {
  const source = Float32Array.from({length: 4103}, (_, i) => .3 * Math.sin(i * .075) + .1 * Math.cos(i * .11));
  const rebuilt = reduceProfileNoise(source, new Float64Array(FFT_SIZE / 2 + 1));
  assert.equal(rebuilt.length, source.length);
  assert.ok(rebuilt.every((value, i) => Math.abs(value - source[i]) < 1e-6));
});

test('rumble correction survives a failed neural preview', () => {
  const {voice} = fixtures();
  const rumble = voice.map((sample, i) => sample + .022 * Math.sin(2 * Math.PI * 31 * i / rate));
  const info = analyze(rumble);
  const plan = choosePreviewPlan(rumble, rumble, choosePlan(info), info);
  assert.equal(plan.wet, 0);
  assert.equal(plan.highpass, 75);
  assert.ok(validateFinal(rumble, rumble, plan, info).actions.includes('rumble'));
});

test('a failed full-length neural pass keeps the validated rumble correction', () => {
  const {voice} = fixtures();
  const rumble = voice.map((sample, i) => sample + .022 * Math.sin(2 * Math.PI * 31 * i / rate));
  const info = analyze(rumble);
  const plan = choosePreviewPlan(rumble, null, choosePlan(info), info);
  const destructive = rumble.map(value => -value);
  const out = validateFinal(rumble, destructive, {...plan, wet: 1}, info);
  assert.ok(out.actions.includes('rumble'));
  assert.ok(!out.actions.includes('noise'));
});

test('repeated 60 Hz tone in quiet spans can be isolated as hum', () => {
  const {voice} = fixtures();
  const humming = voice.map((sample, i) => sample + .018 * Math.sin(2 * Math.PI * 60 * i / rate));
  const info = analyze(humming);
  assert.ok(info.issues.hum.confidence >= .75);
  assert.equal(info.issues.hum.level, 60);
  const plan = choosePreviewPlan(humming, humming, choosePlan(info), info);
  const result = validateFinal(humming, humming, plan, info);
  assert.ok(result.actions.includes('hum'));
});

test('a quiet voice gets bounded gain and pristine digital silence stays silent', () => {
  const {voice} = fixtures();
  const quiet = voice.map(value => value * .06);
  const info = analyze(quiet);
  const plan = choosePreviewPlan(quiet, null, choosePlan(info), info);
  const {samples, actions} = validateFinal(quiet, null, plan, info);
  const gain = integratedLoudness(samples)! - info.loudness!;
  assert.ok(gain >= 1 && gain <= 6.01);
  assert.ok(actions.includes('volume'));
  const silent = new Float32Array(rate);
  const silentInfo = analyze(silent);
  assert.deepEqual(validateFinal(silent, null, choosePlan(silentInfo), silentInfo), {samples: silent, actions: []});
});

test('adaptive compression reduces large phrase-to-phrase level changes', () => {
  const {voice} = fixtures();
  const uneven = voice.map((sample, i) => i < voice.length / 2 ? .12 * sample : sample * 1.5);
  const info = analyze(uneven);
  const plan = choosePreviewPlan(uneven, null, choosePlan(info), info);
  assert.ok(plan.compress);
  const result = validateFinal(uneven, null, plan, info);
  assert.ok(compare(uneven, result.samples, info).variation < compare(uneven, uneven, info).variation - .5);
});

test('short strong high-band bursts can trigger bounded de-essing', () => {
  const {voice} = fixtures();
  const hissy = voice.map((sample, i) => i % 19200 < 1920 && sample !== 0
    ? sample + .23 * Math.sin(2 * Math.PI * 6500 * i / rate)
    : sample);
  const info = analyze(hissy);
  assert.equal(choosePlan(info).deEss, true);
  const plan = choosePreviewPlan(hissy, null, choosePlan(info), info);
  const result = validateFinal(hissy, null, plan, info);
  assert.ok(result.actions.includes('sibilance'));
  assert.ok(compare(hissy, result.samples, info).similarity > .95);
});

test('fourfold interpolation detects between-sample peaks and trims to a safe ceiling', () => {
  const tone = Float32Array.from({length: rate}, (_, i) => .99 * Math.sin(i * Math.PI / 2 + Math.PI / 4) * Math.min(1, i / 250, (rate - 1 - i) / 250));
  const info = analyze(tone);
  assert.ok(estimateTruePeak(tone) > info.samplePeak + .2);
  const result = validateFinal(tone, null, choosePlan(info), info);
  assert.ok(result.actions.includes('peaks'));
  assert.ok(toDb(estimateTruePeak(result.samples)) <= -1.49);
});

test('preview stays within the source and chooses useful activity from beyond the intro', () => {
  const {voice} = fixtures();
  const source = new Float32Array(rate * 22);
  source.set(voice, 12 * rate);
  const info = analyze(source);
  const {start, end} = previewRange(info, source.length);
  assert.ok(start > 0 && end <= source.length);
  assert.equal(end - start, 8 * rate);
  assert.equal(renderPlan(source, null, choosePlan(info)).samples.length, source.length);
});
