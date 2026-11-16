export const ASSETS = '/voice-assets';
export type RuntimeManifest = { package: string; version: string; validated: boolean; delaySamples: number; frameLength: number; ffmpeg: boolean };

export function isRuntimeManifest(value: unknown): value is RuntimeManifest {
  if (typeof value !== 'object' || value === null) return false;
  const info = value as RuntimeManifest;
  return info.package === '@lofcz/deepfilternet-web' && info.version === '0.1.0' && info.validated === true && info.frameLength === 480 && Number.isInteger(info.delaySamples) && info.delaySamples >= 0 && info.delaySamples <= 4800 && typeof info.ffmpeg === 'boolean';
}

export async function checkRuntime(signal?: AbortSignal): Promise<RuntimeManifest> {
  if (!globalThis.isSecureContext || typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') throw new Error('Use a modern browser over HTTPS with WebAssembly and Workers enabled.');
  const response = await fetch(`${ASSETS}/manifest.json`, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('The AI runtime is unavailable on this deployment. Your recording stays on this device.');
  const info: unknown = await response.json();
  if (!isRuntimeManifest(info)) throw new Error('This deployment has an incomplete AI runtime. Try again after the runtime is updated.');
  return info;
}
