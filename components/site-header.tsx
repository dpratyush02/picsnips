"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/tools", label: "Tools" },
  { href: "/#examples", label: "Explore" },
  { href: "/#community", label: "Community" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader({ showFaqLink }: { showFaqLink: boolean }) {
  const [open, setOpen] = useState(false);
  const visibleLinks = showFaqLink ? links : links.filter(({ href }) => href !== "/#faq");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div
        className="site-width grid h-16 grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]"
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            setOpen(false);
            document.getElementById("site-menu-button")?.focus();
          }
        }}
      >
        <Link href="/" className="justify-self-start rounded-md focus-visible:outline-2" aria-label="PicSnips home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Primary">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-self-end gap-2">
          <ThemeToggle />
          <Button asChild className="editorial-button hidden min-[420px]:inline-flex">
            <Link href="/tools">Start Creating <ArrowUpRight className="size-3.5" /></Link>
          </Button>
          <Button
            id="site-menu-button"
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-10 rounded-full border-line md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          hidden={!open}
          className="absolute inset-x-0 top-full border-b border-line bg-background p-4 md:hidden"
        >
          <div className="site-width grid gap-1">
            {visibleLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="nav-link" onClick={() => setOpen(false)}>{label}</Link>
            ))}
            <Button asChild className="editorial-button mt-2 justify-self-start">
              <Link href="/tools" onClick={() => setOpen(false)}>Start Creating <ArrowUpRight className="size-3.5" /></Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
