import Link from 'next/link';

export function VoiceAnnouncement() {
  return (
    <aside className="border-b border-border bg-primary/5 px-6 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs sm:text-sm">
        <strong>NEW: PicSnips Auto Enhance is here.</strong>
        <span className="text-muted-foreground">Remove background noise from audio and video. Free. No signup.</span>
        <Link href="/tools/voice-enhancer" className="font-medium underline underline-offset-4 hover:text-primary">Try It Now →</Link>
      </div>
    </aside>
  );
}
