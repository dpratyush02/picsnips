import Link from "next/link";
import { Logo } from "@/components/logo";

const groups = [
  { title: "Create", links: [{ href: "/tools", label: "All tools" }, { href: "/split", label: "Image Splitter" }, { href: "/library", label: "Image Library" }] },
  { title: "Explore", links: [{ href: "/#examples", label: "Made with PicSnips" }, { href: "/#community", label: "Community" }, { href: "/#faq", label: "FAQ" }] },
  { title: "PicSnips", links: [{ href: "/sponsors", label: "Sponsor PicSnips" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
];

export function SiteFooter({ showFaqLink }: { showFaqLink: boolean }) {
  return (
    <footer className="border-t border-line">
      <div className="site-width grid gap-8 py-11 md:grid-cols-[1fr_1.4fr]">
        <div>
          <Link href="/" aria-label="PicSnips home" className="inline-flex rounded-md focus-visible:outline-2">
            <Logo />
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Free creative tools, right in your browser.</p>
        </div>
        <nav className="grid grid-cols-2 gap-6 sm:grid-cols-3" aria-label="Footer">
          {groups.map(({ title, links }) => (
            <div key={title}>
              <p className="mb-2 text-sm font-medium">{title}</p>
              <ul className="space-y-2">
                {links.filter(({ href }) => showFaqLink || href !== "/#faq").map(({ href, label }) => (
                  <li key={href}><Link href={href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="site-width py-4 text-xs leading-5 text-muted-foreground">
          <p>
            Made with love by{" "}
            <a
              href="https://x.com/dpratyush02"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              @dpratyush02
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
