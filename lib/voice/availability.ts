import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isRuntimeManifest } from './runtime';

// Static pages advertise the feature only when prepared assets exist at build time.
export function hasVoiceRuntime() {
  const base = join(process.cwd(), 'public', 'voice-assets');
  try {
    const info = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
    return isRuntimeManifest(info) && existsSync(join(base, 'deepfilter', 'entry.mjs')) && existsSync(join(base, 'deepfilter', 'df_bg.wasm'));
  } catch { return false; }
}
