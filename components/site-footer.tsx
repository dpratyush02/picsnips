import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">Made for creators on X</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" aria-label="Footer">
          <Link href="/#demo" className="hover:text-foreground">Demo</Link>
          <Link href="/#library" className="hover:text-foreground">Library</Link>
          <Link href="/#examples" className="hover:text-foreground">Real Posts</Link>
          <Link href="/#how" className="hover:text-foreground">How It Works</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
      </div>
      <div className="border-t border-border/70">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs leading-5 text-muted-foreground">
          PicSnips is an independent tool and is not affiliated with X Corp. Images are processed in your browser and are not uploaded to PicSnips.
        </p>
      </div>
    </footer>
  );
}
