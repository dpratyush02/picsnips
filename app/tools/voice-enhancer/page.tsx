import type { Metadata } from 'next';
import { SiteFrame } from '@/components/site-frame';
import { ToolPageIntro } from '@/components/tool-page-intro';
import VoiceEnhancer from '@/components/voice/voice-enhancer';
import { hasVoiceRuntime } from '@/lib/voice/availability';
import { siteUrl } from '@/lib/site';

export function generateMetadata(): Metadata {
  return {
    title: {absolute: 'Free AI Voice Enhancer & Noise Remover | PicSnips'},
    description: 'Remove background noise from audio and video with PicSnips AI Voice Enhancer. Powered by DeepFilterNet3. Free, private, and no signup required.',
    alternates: {canonical: `${siteUrl}/tools/voice-enhancer`},
    robots: hasVoiceRuntime() ? undefined : {index: false, follow: true},
  };
}
export default function VoiceEnhancerPage() {
  const ready = hasVoiceRuntime();
  return (
    <SiteFrame showFaqLink={false}>
      <main className="site-width min-h-[75vh] pb-16 pt-10 sm:pb-24 sm:pt-16">
        <ToolPageIntro
          label="PicSnips Auto Enhance"
          title="Make every voice sound clear."
          body="Upload a recording and let PicSnips adjust it automatically. Listen to the difference before you download."
        />
        {ready ? <VoiceEnhancer /> : <p role="status" className="mt-8 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">The local AI runtime is unavailable on this deployment. Enhancement will be available once the model assets are installed.</p>}
        <p className="mt-8 text-xs text-muted-foreground">Powered by <a className="underline" href="https://github.com/Rikorose/DeepFilterNet">DeepFilterNet3</a> · <a className="underline" href="/voice-licenses/DeepFilterNet-MIT.txt">MIT license</a></p>
      </main>
    </SiteFrame>
  );
}
