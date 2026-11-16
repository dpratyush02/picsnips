"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const dockOffset = 16;
const morphDistance = 128;
const links = [
  { href: "#examples", label: "Explore" },
  { href: "#community", label: "Community" },
  { href: "#faq", label: "FAQ" },
];

export function HeroNavigation() {
  const slot = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [docked, setDocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const element = slot.current;
    const nav = navigation.current;
    if (!element || !nav) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = false;
    const update = () => {
      frame = 0;
      const top = element.getBoundingClientRect().top;
      const pastTop = top <= dockOffset;
      const scrollProgress = Math.max(0, Math.min(1, 1 - (top - dockOffset) / morphDistance));
      const progress = reducedMotion.matches ? Number(pastTop) : scrollProgress ** 2 * (3 - 2 * scrollProgress);
      nav.style.setProperty("--hero-nav-progress", String(progress));
      nav.style.setProperty("--hero-nav-y", `${Math.max(top, dockOffset)}px`);
      nav.toggleAttribute("data-floating", progress > 0);
      if (pastTop === previous) return;
      previous = pastTop;
      setDocked(pastTop);
      if (!pastTop) setMenuOpen(false);
    };
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    reducedMotion.addEventListener("change", queue);
    queue();

    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      reducedMotion.removeEventListener("change", queue);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={slot} className="hero-action">
      <nav
        ref={navigation}
        aria-label="Primary"
        className="hero-nav"
        data-docked={docked || undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className="hero-nav-pill">
          <a
            href="#main-content"
            aria-label="PicSnips home"
            className="hero-nav-extra hero-nav-brand"
            inert={!docked}
            onClick={() => setMenuOpen(false)}
          >
            <Logo />
          </a>
          <div className="hero-nav-extra hero-nav-desktop" inert={!docked}>
            {links.map(({ href, label }) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </div>
          <a href="#tools" className="hero-primary" onClick={() => setMenuOpen(false)}>
            <span aria-hidden="true" className="size-2 rounded-full bg-current" />
            Explore Tools
          </a>
          <div className="hero-nav-extra hero-nav-controls" inert={!docked}>
            <ThemeToggle />
            <button
              ref={menuButton}
              type="button"
              className="hero-nav-menu-button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="hero-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
            </button>
          </div>
        </div>
        <div id="hero-mobile-menu" className="hero-nav-mobile" hidden={!docked || !menuOpen}>
          {links.map(({ href, label }) => (
            <a key={href} href={href} className="nav-link" onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
