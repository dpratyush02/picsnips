"use client";

import { useEffect, useRef } from "react";
import { inkManager } from "@/lib/ink-transition";

export function InkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      inkManager.init(canvasRef.current);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ink-canvas"
      aria-hidden="true"
    />
  );
}
