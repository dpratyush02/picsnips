import { cn } from "cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="currentColor" />
        <g fill="black">
          <rect x="5" y="6" width="2" height="16" rx="0.5" opacity="0.95" />
          <rect x="9" y="6" width="2" height="16" rx="0.5" opacity="0.8" />
          <rect x="13" y="6" width="2" height="16" rx="0.5" opacity="0.65" />
          <rect x="17" y="6" width="2" height="16" rx="0.5" opacity="0.5" />
          <rect x="21" y="6" width="2" height="16" rx="0.5" opacity="0.35" />
        </g>
      </svg>
      PicSnap
    </span>
  );
}
