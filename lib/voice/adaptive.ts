import { SAMPLE_RATE } from './dsp.ts';
import { FRAME, percentile, voiceSpread, type Diagnostics } from './diagnostics.ts';
import { clamp, estimateTruePeak, filter, fromDb, integratedLoudness, toDb } from './metering.ts';

type Profile = 'baseline' | 'podcast' | 'voiceover' | 'interview' | 'outdoor';
export type Plan = {
  profile: Profile;
  wet: number;
  highpass: number;
  hum: number;
  eq: { hz: number; db: number } | null;
  deEss: boolean;
  compress: boolean;
  target: number | null;
};
const ceiling = fromDb(-1.5);
const safePlan: Plan = {
  profile: 'baseline', wet: 0, highpass: 0, hum: 0, eq: null, deEss: false, compress: false, target: null,
};
const profiles: Record<Profile, { wet: number; target: number }> = {
  baseline: {wet: .8, target: -18},
  podcast: {wet: .94, target: -17},
  voiceover: {wet: .86, target: -18},
  interview: {wet: .72, target: -18},
  outdoor: {wet: .92, target: -18},
};

export function choosePlan(info: Diagnostics): Plan {
  const {issues} = info;
  const confirmed = (name: keyof typeof issues) => issues[name].confidence >= .75;
  // Profiles describe signal characteristics. A volume spread can be a
  // conversation cue, but it does not establish that multiple people spoke.
  let profile: Profile = 'baseline';
  if (confirmed('rumble') && confirmed('noise')) profile = 'outdoor';
  else if (confirmed('variation')) profile = 'interview';
  else if (confirmed('noise')) profile = 'podcast';
  else if (info.activityConfidence >= .85 && (info.approximateSnr ?? 0) >= 32) profile = 'voiceover';
  const eq = confirmed('harsh') ? {hz: 3000, db: -1.5}
    : confirmed('mud') ? {hz: 360, db: -1.5}
    : confirmed('dull') ? {hz: 2600, db: 1.25}
    : null;
  return {
    profile,
    wet: issues.noise.confidence >= .6 ? profiles[profile].wet : 0,
    highpass: confirmed('rumble') ? 75 : 0,
    hum: confirmed('hum') && info.activityConfidence >= .6 ? issues.hum.level : 0,
    eq,
    deEss: confirmed('sibilance'),
    compress: confirmed('variation'),
    target: info.activityConfidence >= .75 ? profiles[profile].target : null,
  };
}

export function previewRange(diagnostics: Diagnostics, length: number) {
  const previewSize = 8 * SAMPLE_RATE;
  if (length <= previewSize) return {start: 0, end: length};
  const size = previewSize / FRAME;
  let best = -1, bestStart = 0;
  for (let start = 0; start <= diagnostics.frames.length - size; start += Math.floor(size / 2)) {
    if (start * FRAME + previewSize > length) break;
    const frames = diagnostics.frames.slice(start, start + size);
    const active = frames.filter(f => f.active).length / size;
    const quiet = frames.filter(f => f.quiet).length / size;
    const score = Math.min(.55, active) + .8 * Math.min(.25, quiet);
    if (score > best) {
      best = score;
      bestStart = start * FRAME;
    }
  }
  return {start: bestStart, end: bestStart + previewSize};
}

export type RenderReport = {
  loudness: number | null;
  outputTruePeak: number;
  limiterDb: number;
  gainDb: number;
  compressionDb: number;
  deEssDb: number;
  toneDeltaDb: number;
};

function zeroPhase(samples: Float32Array, makeFilter: () => (sample: number) => number) {
  const forward = makeFilter();
  const reverse = makeFilter();
  for (let i = 0; i < samples.length; i++) samples[i] = forward(samples[i]);
  for (let i = samples.length - 1; i >= 0; i--) samples[i] = reverse(samples[i]);
}

export function renderPlan(dry: Float32Array, wet: Float32Array | null, plan: Plan) {
  if (wet && wet.length !== dry.length) throw new Error('Enhancement changed the audio duration.');
  const out = new Float32Array(dry.length);
  for (let i = 0; i < out.length; i++) {
    const mixed = wet && plan.wet > 0 ? dry[i] + plan.wet * (wet[i] - dry[i]) : dry[i];
    if (!Number.isFinite(mixed)) throw new Error('Enhancement produced invalid audio samples.');
    out[i] = mixed;
  }
  // Offline forward/reverse filtering avoids shifting low fundamentals in
  // time relative to the dry track or a source video.
  if (plan.highpass) zeroPhase(out, () => filter('highpass', plan.highpass, .707));
  if (plan.hum) zeroPhase(out, () => filter('notch', plan.hum, 12));
  const eq = plan.eq ? filter('peak', plan.eq.hz, .9, plan.eq.db) : null;
  const sibilance = plan.deEss ? filter('bandpass', 6300, 1.4) : null;
  const attack = Math.exp(-1 / (.008 * SAMPLE_RATE));
  const release = Math.exp(-1 / (.16 * SAMPLE_RATE));
  let deEssDb = 0, compressionDb = 0, toneDelta = 0, energy = 0;
  let level = 0, highLevel = 0, peak = 0;
  for (let i = 0; i < out.length; i++) {
    const source = out[i];
    let value = eq ? eq(source) : source;
    toneDelta += (value - source) ** 2;
    energy += source ** 2;
    if (sibilance || plan.compress) {
      const coefficient = Math.abs(value) > level ? attack : release;
      level = coefficient * level + (1 - coefficient) * Math.abs(value);
    }
    if (sibilance) {
      const band = sibilance(value);
      const coefficient = Math.abs(band) > highLevel ? attack : release;
      highLevel = coefficient * highLevel + (1 - coefficient) * Math.abs(band);
      const reduction = highLevel > .005 ? clamp(toDb(highLevel / Math.max(level, .005)) + 7, 0, 2.5) : 0;
      if (reduction > 0) value -= band * (1 - fromDb(-reduction));
      deEssDb = Math.max(deEssDb, reduction);
    }
    if (plan.compress) {
      const reduction = clamp((toDb(level) + 19) * .38, 0, 4);
      if (reduction > 0) value *= fromDb(-reduction);
      compressionDb = Math.max(compressionDb, reduction);
    }
    out[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const loudness = integratedLoudness(out);
  // Cap boost and preserve some natural loudness differences across recordings.
  const gainDb = plan.target === null || loudness === null ? 0 : clamp(plan.target - loudness, -9, 6);
  const gain = fromDb(gainDb);
  const truePeak = estimateTruePeak(out, peak);
  // Use one transparent gain trim to protect between-sample peaks. No
  // waveform saturation or lookahead delay is introduced.
  const limit = truePeak * gain > ceiling ? ceiling / (truePeak * gain) : 1;
  if (gain * limit !== 1) {
    for (let i = 0; i < out.length; i++) out[i] *= gain * limit;
  }
  const report: RenderReport = {
    loudness: loudness === null ? null : loudness + gainDb + toDb(limit),
    outputTruePeak: truePeak * gain * limit,
    limiterDb: -toDb(limit),
    gainDb: gainDb + toDb(limit),
    compressionDb,
    deEssDb,
    toneDeltaDb: toDb(Math.sqrt(toneDelta / Math.max(energy, 1e-12))),
  };
  return {samples: out, report};
}

export function compare(input: Float32Array, output: Float32Array, reference: Diagnostics) {
  if (input.length !== output.length) throw new Error('Enhancement changed the audio duration.');
  let dryActive = 0, wetActive = 0, dryQuiet = 0, wetQuiet = 0, activeCount = 0, quietCount = 0;
  const similarities: number[] = [];
  const activeLevels: (number | null)[] = [];
  let peak = 0;
  for (let start = 0, frame = 0; start < input.length; start += FRAME, frame++) {
    let dryPower = 0, wetPower = 0, dot = 0;
    const end = Math.min(input.length, start + FRAME);
    for (let i = start; i < end; i++) {
      if (!Number.isFinite(output[i])) throw new Error('Enhancement produced invalid audio samples.');
      peak = Math.max(peak, Math.abs(output[i]));
      dryPower += input[i] ** 2;
      wetPower += output[i] ** 2;
      dot += input[i] * output[i];
    }
    const isActive = reference.frames[frame]?.active;
    activeLevels.push(isActive ? toDb(Math.sqrt(wetPower / (end - start))) : null);
    if (isActive) {
      dryActive += dryPower; wetActive += wetPower; activeCount += end - start;
      similarities.push(dot / Math.max(Math.sqrt(dryPower * wetPower), 1e-12));
    } else if (reference.frames[frame]?.quiet) {
      dryQuiet += dryPower; wetQuiet += wetPower; quietCount += end - start;
    }
  }
  const contrast = (active: number, quiet: number) => toDb(Math.sqrt(active / activeCount)) - toDb(Math.sqrt(quiet / quietCount));
  const noiseImprovement = activeCount >= FRAME * 4 && quietCount >= FRAME * 4 && dryQuiet / quietCount > 1e-7
    ? contrast(wetActive, wetQuiet) - contrast(dryActive, dryQuiet)
    : null;
  return {
    similarity: similarities.length ? percentile(similarities, .1) : 1,
    variation: voiceSpread(activeLevels),
    noiseImprovement,
    peak,
  };
}

export function acceptable(metrics: ReturnType<typeof compare>) {
  // Level-invariant proxies flag obvious damage. They do not certify subjective quality.
  return metrics.peak < 1 && metrics.similarity >= .82 &&
    (metrics.noiseImprovement === null || metrics.noiseImprovement >= -.8);
}

export function choosePreviewPlan(dry: Float32Array, wet: Float32Array | null, proposed: Plan, reference: Diagnostics) {
  let plan = {...safePlan, profile: proposed.profile};
  let measured = compare(dry, dry, reference);
  function check(changes: Partial<Plan>, improves?: (next: ReturnType<typeof compare>, rendered: ReturnType<typeof renderPlan>) => boolean) {
    const candidate = {...plan, ...changes};
    const result = renderPlan(dry, wet, candidate);
    const next = compare(dry, result.samples, reference);
    if (!acceptable(next) || (improves && !improves(next, result))) return false;
    if (candidate.wet > 0 && (next.noiseImprovement ?? 0) < 1) return false;
    plan = candidate;
    measured = next;
    return true;
  }
  // Reject individual effects independently. An unhelpful denoiser should
  // not prevent an independently successful rumble or hum correction.
  if (proposed.highpass || proposed.hum) {
    const hz = proposed.hum || 0;
    const before = quietBandRelativeToVoice(dry, reference, hz);
    check({highpass: proposed.highpass, hum: proposed.hum}, (_, result) => before - quietBandRelativeToVoice(result.samples, reference, hz) >= 2);
  }
  if (proposed.wet > 0 && wet) {
    const previousNoise = measured.noiseImprovement ?? 0;
    const reducesNoise = (next: ReturnType<typeof compare>) => (next.noiseImprovement ?? 0) >= Math.max(1, previousNoise + .8);
    if (!check({wet: proposed.wet}, reducesNoise) && !check({wet: proposed.wet * .8}, reducesNoise)) {
      check({wet: proposed.wet * .55}, reducesNoise);
    }
  }
  if (proposed.eq) check({eq: proposed.eq}, (_, result) => result.report.toneDeltaDb > -42);
  if (proposed.deEss) check({deEss: true}, (_, result) => result.report.deEssDb >= .5);
  if (proposed.compress) check({compress: true}, next => next.variation <= measured.variation - .5);
  if (proposed.target !== null) check({target: proposed.target});
  return plan;
}

export type EnhanceAction = 'noise' | 'rumble' | 'hum' | 'clarity' | 'sibilance' | 'volume' | 'peaks';
export type EnhanceResult = {samples: Float32Array; actions: EnhanceAction[]};

function quietBandRelativeToVoice(samples: Float32Array, reference: Diagnostics, humHz: number) {
  const band = humHz ? filter('bandpass', humHz, 12) : filter('lowpass', 90, .707);
  let quietPower = 0, voicePower = 0;
  for (let start = 0, frame = 0; start < samples.length; start += FRAME, frame++) {
    const {quiet, active} = reference.frames[frame];
    for (let i = start; i < Math.min(samples.length, start + FRAME); i++) {
      const filtered = band(samples[i]);
      if (quiet) quietPower += filtered ** 2;
      if (active) voicePower += samples[i] ** 2;
    }
  }
  return toDb(Math.sqrt(quietPower / Math.max(voicePower, 1e-10)));
}

export function validateFinal(dry: Float32Array, wet: Float32Array | null, plan: Plan, reference: Diagnostics): EnhanceResult {
  let result = renderPlan(dry, wet, plan);
  let measured = compare(dry, result.samples, reference);
  const original = compare(dry, dry, reference);
  const rejected = () => !acceptable(measured) ||
    (plan.wet > 0 && (measured.noiseImprovement ?? 0) < 1) ||
    (plan.compress && measured.variation >= original.variation - .5);
  const revise = (changes: Partial<Plan>) => {
    plan = {...plan, ...changes};
    result = renderPlan(dry, plan.wet > 0 ? wet : null, plan);
    measured = compare(dry, result.samples, reference);
  };
  if (plan.compress && measured.variation >= original.variation - .5) revise({compress: false});
  if (rejected() && plan.wet) revise({wet: 0});
  if (rejected()) {
    revise(safePlan);
  }
  if (result.samples.length !== dry.length || measured.peak >= 1 || result.report.outputTruePeak > ceiling + 1e-6) {
    throw new Error('The final recording could not be safely exported.');
  }
  const {report} = result;
  const actions: EnhanceAction[] = [];
  if (plan.wet > 0 && (measured.noiseImprovement ?? 0) >= 1) actions.push('noise');
  const reducedBand = (hz: number) => quietBandRelativeToVoice(dry, reference, hz) - quietBandRelativeToVoice(result.samples, reference, hz) >= 2;
  if (plan.highpass && reducedBand(0)) actions.push('rumble');
  if (plan.hum && reducedBand(plan.hum)) actions.push('hum');
  if (plan.eq && report.toneDeltaDb > -42) actions.push('clarity');
  if (plan.deEss && report.deEssDb >= .5) actions.push('sibilance');
  const normalized = plan.target !== null && Math.abs(report.gainDb) >= 1 && report.loudness !== null && reference.loudness !== null &&
    Math.abs(reference.loudness - plan.target) - Math.abs(report.loudness - plan.target) >= 1;
  if (normalized || (report.compressionDb >= .5 && original.variation - measured.variation >= .5)) actions.push('volume');
  if (report.limiterDb > .1) actions.push('peaks');
  return {samples: result.samples, actions};
}
