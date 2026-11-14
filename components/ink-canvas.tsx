"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { inkManager } from "@/lib/ink-transition";

export function InkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (canvasRef.current) {
      inkManager.init(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    // Refresh snapshot on navigation
    inkManager.scheduleCapture(200);
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      className="ink-canvas"
      aria-hidden="true"
    />
  );
}
