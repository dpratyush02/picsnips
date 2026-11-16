import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const staging = await mkdtemp(join(tmpdir(), 'picsnips-voice-'));
const assets = join(staging, 'assets');
const pkg = '@lofcz/deepfilternet-web';
const version = '0.1.0';
const ffmpeg = process.argv.includes('--ffmpeg');

async function unpack(name, pinnedVersion, folder) {
  const target = join(staging, folder);
  await mkdir(target);
  const response = execFileSync('npm', ['pack', `${name}@${pinnedVersion}`, '--json', '--prefer-offline', '--fetch-retries=0', '--fetch-timeout=20000'], {cwd: target, encoding: 'utf8'});
  const [{filename, integrity}] = JSON.parse(response);
  execFileSync('tar', ['-xzf', filename], {cwd: target});
  console.log(`${name}@${pinnedVersion} ${integrity}`);
  return join(target, 'package');
}

async function copyNotices(source, destination) {
  for (const name of await readdir(source)) {
    if (/^(license|copying|notice)/i.test(name)) await cp(join(source, name), join(destination, name), {recursive: true});
  }
}

// A repeatable timing smoke check. Human listening and video sync still need browser QA.
async function verify(directory) {
  // Node resolves the imported module's path through symlinks (such as macOS /var).
  const moduleDirectory = await realpath(directory);
  const wasmUrl = pathToFileURL(join(moduleDirectory, 'df_bg.wasm'));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const path = input instanceof Request ? input.url : String(input);
    if (path !== wasmUrl.href) throw new Error(`Unexpected model asset request: ${path}`);
    return new Response(await readFile(wasmUrl), {headers: {'Content-Type': 'application/wasm'}});
  };
  let filter;
  try {
    const {DeepFilter} = await import(pathToFileURL(join(moduleDirectory, 'entry.mjs')).href);
    // Keep enough of the synthetic reference for timing correlation. The editor
    // uses the full model and blends the result with the delay-aligned original.
    filter = await DeepFilter.create({attenuationLimit: 12});
    if (filter.frameLength !== 480) throw new Error('DeepFilterNet3 did not provide 480-sample frames.');
    const samples = new Float32Array(72000), expected = new Float32Array(samples.length), result = new Float32Array(samples.length);
    let seed = 12345, phase = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / 48000;
      phase += 2 * Math.PI * (130 + 53 * Math.sin(t * 17) + 23 * Math.sin(t * 37)) / 48000;
      const envelope = .23 * Math.max(0, Math.sin(t * 18 - 1));
      expected[i] = envelope * (Math.sin(phase) + .35 * Math.sin(3 * phase) + .2 * Math.sin(7 * phase));
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = expected[i] + .08 * (seed / 0xffffffff - .5);
    }
    const started = performance.now();
    for (let i = 0; i < samples.length; i += 480) {
      const frame = filter.process(samples.slice(i, i + 480));
      if (frame.length !== 480 || !frame.every(Number.isFinite)) throw new Error('DeepFilterNet3 returned invalid inference output.');
      result.set(frame, i);
    }
    const elapsed = performance.now() - started;
    let best = -1, delaySamples = 0;
    // DeepFilterNet3's STFT and lookahead introduce whole-hop latency.
    for (let delay = 0; delay <= 4800; delay += filter.frameLength) {
      let dot = 0, power = 0, reference = 0;
      for (let i = 8000; i < 60000; i += 31) {
        const processed = result[i + delay];
        dot += expected[i] * processed;
        power += processed * processed;
        reference += expected[i] * expected[i];
      }
      const correlation = dot / Math.sqrt(power * reference);
      if (correlation > best) { best = correlation; delaySamples = delay; }
    }
    let change = 0;
    for (let i = 8000; i < 60000; i++) change += (samples[i] - result[i + delaySamples]) ** 2;
    if (best < .8 || change < .01) throw new Error('Unable to verify DeepFilterNet3 output and alignment.');
    console.log(`Processed ${(samples.length / 48000).toFixed(1)} seconds in ${elapsed.toFixed(0)} ms. Measured delay: ${delaySamples} samples (correlation ${best.toFixed(2)}).`);
    return delaySamples;
  } finally {
    try { filter?.destroy(); } finally { globalThis.fetch = originalFetch; }
  }
}

try {
  const model = await unpack(pkg, version, 'model');
  const manifest = JSON.parse(await readFile(join(model, 'package.json'), 'utf8'));
  const exported = manifest.exports?.['.'] ?? manifest.exports;
  const entry = manifest.module ?? (typeof exported === 'string' ? exported : exported?.import ?? exported?.default) ?? manifest.main;
  if (typeof entry !== 'string' || !/^\.?\/?dist\/[\w./-]+\.(js|mjs)$/.test(entry) || entry.includes('..')) throw new Error('Cannot identify the published browser entry point.');
  const deepfilter = join(assets, 'deepfilter');
  await cp(join(model, 'dist'), deepfilter, {recursive: true});
  await writeFile(join(deepfilter, 'package.json'), '{"type":"module"}\n');
  await writeFile(join(deepfilter, 'entry.mjs'), `export { DeepFilter } from ${JSON.stringify('./' + entry.replace(/^\.?\/?dist\//, ''))};\n`);
  await copyNotices(model, deepfilter);
  await cp(join(root, 'public/voice-licenses'), join(assets, 'licenses'), {recursive: true});
  const delaySamples = await verify(deepfilter);
  if (ffmpeg) {
    const wrapper = await unpack('@ffmpeg/ffmpeg', '0.12.15', 'ffmpeg');
    const core = await unpack('@ffmpeg/core', '0.12.10', 'core');
    await cp(join(wrapper, 'dist/esm'), join(assets, 'ffmpeg'), {recursive: true});
    await cp(join(core, 'dist/esm'), join(assets, 'core'), {recursive: true});
    await copyNotices(wrapper, join(assets, 'ffmpeg'));
    await copyNotices(core, join(assets, 'core'));
    await readFile(join(assets, 'ffmpeg/worker.js'));
    await readFile(join(assets, 'core/ffmpeg-core.wasm'));
  }
  await writeFile(join(assets, 'manifest.json'), JSON.stringify({package: pkg, version, validated: true, delaySamples, frameLength: 480, ffmpeg}) + '\n');
  const output = resolve(root, 'public/voice-assets');
  const next = `${output}.next`;
  await rm(next, {recursive: true, force: true});
  await mkdir(dirname(next), {recursive: true});
  await cp(assets, next, {recursive: true});
  await rm(output, {recursive: true, force: true});
  await rename(next, output);
  console.log('Local voice assets are ready.');
} catch (error) {
  console.error(`Could not prepare voice assets: ${error.message}`);
  process.exitCode = 1;
} finally { await rm(staging, {recursive: true, force: true}); }
