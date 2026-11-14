"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentTheme, inkManager, type Theme } from "@/lib/ink-transition";

function subscribe(callback: () => void) {
  window.addEventListener("picsnips:theme-change", callback);
  return () => window.removeEventListener("picsnips:theme-change", callback);
}

function getSnapshot(): Theme {
  return getCurrentTheme();
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Keyboard shortcut: Press 'T' to toggle theme (Codemure standard)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        const rect = buttonRef.current?.getBoundingClientRect();
        const point = rect
          ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          : undefined;
        inkManager.toggle(point);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const point =
      e.clientX > 0 && e.clientY > 0
        ? { x: e.clientX, y: e.clientY }
        : buttonRef.current
        ? {
            x: buttonRef.current.getBoundingClientRect().left + buttonRef.current.offsetWidth / 2,
            y: buttonRef.current.getBoundingClientRect().top + buttonRef.current.offsetHeight / 2,
          }
        : undefined;

    inkManager.toggle(point);
  };

  const isDark = theme === "dark";

  return (
    <button
      ref={buttonRef}
      type="button"
      data-ink-live=""
      onClick={handleClick}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode (Press T)`}
      title={`Switch to ${isDark ? "light" : "dark"} mode (Press T)`}
      className={`relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/50 hover:bg-muted text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${className || ""}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="size-4 text-amber-300" />
          ) : (
            <Moon className="size-4 text-indigo-600" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
