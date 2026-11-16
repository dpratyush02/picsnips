"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = stage.current;
    const preview = element?.querySelector<HTMLElement>(".hero-workspace");
    if (!element || !preview) return;

    const desktopMotion = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let start = 0;
    let distance = 1;

    const draw = () => {
      frame = 0;
      const travel = Math.min(distance, Math.max(0, window.scrollY - start));
      const progress = travel / distance;
      element.style.setProperty("--hero-travel", `${travel}px`);
      element.style.setProperty("--hero-progress", String(progress));
      element.toggleAttribute("data-hero-settled", progress === 1);
    };

    function queue() {
      if (desktopMotion.matches && !frame) frame = window.requestAnimationFrame(draw);
    }

    const measure = () => {
      const bounds = element.getBoundingClientRect();
      start = Math.max(0, window.scrollY + bounds.top);
      distance = Math.max(1, preview.getBoundingClientRect().top - bounds.top);
      queue();
    };

    const onPreferenceChange = () => {
      if (desktopMotion.matches) {
        measure();
      } else {
        window.cancelAnimationFrame(frame);
        frame = 0;
        element.style.removeProperty("--hero-travel");
        element.style.removeProperty("--hero-progress");
        element.removeAttribute("data-hero-settled");
      }
    };

    const size = new ResizeObserver(measure);
    size.observe(element);
    window.addEventListener("scroll", queue, { passive: true });
    desktopMotion.addEventListener("change", onPreferenceChange);
    measure();

    return () => {
      window.removeEventListener("scroll", queue);
      desktopMotion.removeEventListener("change", onPreferenceChange);
      size.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={stage} className="hero-stage">{children}</div>;
}
