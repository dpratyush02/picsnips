import Link from "next/link";

export function ScrollAnnouncement() {
  return (
    <aside className="border-b border-border bg-primary/5 px-6 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs sm:text-sm">
        <strong>NEW: Scroll Animation Maker</strong>
        <span className="text-muted-foreground">
          Turn any video into a swipeable frame-by-frame experience for X.
        </span>
        <Link href="/tools/scroll-animation" className="font-medium underline underline-offset-4 hover:text-primary">
          Try It Now →
        </Link>
      </div>
    </aside>
  );
}
