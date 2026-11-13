"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section id="demo" className="scroll-mt-24 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Walkthrough"
          title="See how easy it is to cut 20 slices."
          body="Watch the step-by-step screen recording: upload, choose 20 slices, download the ordered ZIP, and post to X in seconds."
        />

        <div className="mt-12 overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
          {/* macOS window header */}
          <div className="flex items-center justify-between px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-500/80" />
              <span className="size-3 rounded-full bg-amber-500/80" />
              <span className="size-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 hidden text-xs font-medium text-white/50 sm:inline">
                PicSnips — Screen Recording Demo
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition"
                aria-label="Fullscreen"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              src="/demo.mp4"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="h-full w-full object-cover cursor-pointer"
            />

            {/* Play/Pause overlay button */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition transform hover:scale-105"
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
              </button>
            </div>

            {/* Bottom floating badge */}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/70">
              <span className="rounded-full bg-black/60 px-3 py-1 backdrop-blur-md border border-white/10 font-mono">
                1080p HD • Screen Recording
              </span>
              <span className="rounded-full bg-black/60 px-3 py-1 backdrop-blur-md border border-white/10">
                Click video to {isPlaying ? "pause" : "play"}
              </span>
            </div>
          </div>

          {/* Steps highlight strip */}
          <div className="mt-4 grid gap-3 px-2 py-2 sm:grid-cols-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                1
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Drop Image:</strong> Select any wide picture or wallpaper
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                2
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Set 20 Slices:</strong> Instant preview in your browser
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                3
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Download & Post:</strong> Numbered 01–20 ready for X
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="rounded-full px-6 gap-2">
            <a href="#splitter">
              <Sparkles className="size-4" />
              Try it now on your own picture
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
