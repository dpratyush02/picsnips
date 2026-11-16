"use client";

import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

const refreshInterval = 5 * 60 * 1000;
const numberFormat = new Intl.NumberFormat("en-US");

export function VisitorCount() {
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number;

    async function refresh() {
      try {
        if (document.visibilityState === "hidden") return;

        const response = await fetch("/api/visitor-count", { signal: controller.signal });
        if (response.ok) {
          const { visitors } = await response.json();
          if (typeof visitors === "number" && !controller.signal.aborted) {
            setVisitors(visitors);
          }
        }
      } catch {
        // Keep the last known count while the connection recovers.
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(refresh, refreshInterval);
      }
    }

    void refresh();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground"
      title={visitors === null ? "Visitor milestone recorded in Vercel Analytics" : "Visitors in the last 7 days"}
    >
      <UsersRound aria-hidden="true" className="hidden size-4 sm:inline" />
      <span>
        <strong className="font-medium text-foreground tabular-nums">
          {visitors === null ? "5,198+" : numberFormat.format(visitors)}
        </strong>{" "}visitors
        <span className="sr-only">{visitors === null ? " reached previously" : " in the last 7 days"}</span>
      </span>
    </span>
  );
}
