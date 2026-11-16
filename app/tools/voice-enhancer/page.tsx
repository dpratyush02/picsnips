import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFrame } from '@/components/site-frame';
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
const faqs = [
  ['How does the AI voice enhancer work?', 'PicSnips checks your recording locally, tries adjustments on a short preview, then applies the ones that pass its checks. It can use DeepFilterNet3 to reduce background noise. Use A/B playback to hear what changed.'],
  ['Which formats can I use?', 'Try MP3, WAV, M4A, OGG or WebM audio. The optional media runtime also supports extracting and replacing audio in compatible MP4, MOV and WebM videos, and exporting MP3. Support depends on the actual codec and the browser or media runtime available.'],
  ['Does it repair clipped audio or remove echo?', 'Noise reduction works best with a clearly recorded voice and steady background noise. Music, other voices, echo and clipping can remain. Severely damaged or missing speech cannot be recovered.'],
  ['Do my files leave my device?', 'Your browser fetches the AI model and any required media tools from PicSnips the first time you use them. Decoding, inference, preview and export happen on your device. Your recording and results are never sent to PicSnips.'],
  ['Is it free?', 'Yes. Your device runs inference locally. There are no per-minute AI processing charges or signup requirements. PicSnips still uses normal website hosting and bandwidth to deliver the tool.'],
];

export default function VoiceEnhancerPage() {
  const ready = hasVoiceRuntime();
  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">← All tools</Link>
        <p className="mt-6 text-sm font-medium text-primary">PicSnips Auto Enhance <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-[10px]">NEW</span></p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Make Every Voice Sound Clear.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Upload a recording and let PicSnips adjust it automatically. Listen to the difference before you download.</p>
        {ready ? <VoiceEnhancer /> : <p role="status" className="mt-8 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">The local AI runtime is unavailable on this deployment. Enhancement will be available once the model assets are installed.</p>}
        <section className="mt-16 max-w-3xl space-y-3" aria-labelledby="voice-faq">
          <h2 id="voice-faq" className="mb-6 text-2xl font-semibold">Frequently asked questions</h2>
          {faqs.map(([question, answer]) => <details key={question} className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}
        </section>
        <p className="mt-8 text-xs text-muted-foreground">Powered by <a className="underline" href="https://github.com/Rikorose/DeepFilterNet">DeepFilterNet3</a> · <a className="underline" href="/voice-licenses/DeepFilterNet-MIT.txt">MIT license</a></p>
      </main>
    </SiteFrame>
  );
}
