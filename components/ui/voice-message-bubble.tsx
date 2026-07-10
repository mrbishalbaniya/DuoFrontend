"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceMessageBubbleProps {
  audioSrc: string;
  duration?: number;
  bubbleColor?: string;
  waveColor?: string;
  onGradientBubble?: boolean;
  compact?: boolean;
  className?: string;
}

const BAR_COUNT = 30;

function seedHeights(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  return Array.from({ length: BAR_COUNT }, (_, idx) => {
    const value = Math.abs(Math.sin(hash + idx * 12.9898) * 10000) % 1;
    return 4 + value * 12;
  });
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VoiceMessageBubble({
  audioSrc,
  duration: durationProp = 0,
  bubbleColor = "transparent",
  waveColor = "#b76e79",
  onGradientBubble = false,
  compact = false,
  className,
}: VoiceMessageBubbleProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const waveRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(durationProp);
  const barHeights = React.useMemo(() => seedHeights(audioSrc), [audioSrc]);

  const disposeAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audioRef.current = null;
  }, []);

  const ensureAudio = React.useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.preload = "none";
    audio.src = audioSrc;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.floor(audio.duration));
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    (audio as HTMLAudioElement & { __duoCleanup?: () => void }).__duoCleanup = () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };

    return audio;
  }, [audioSrc]);

  React.useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    return () => {
      const audio = audioRef.current as
        | (HTMLAudioElement & { __duoCleanup?: () => void })
        | null;
      audio?.__duoCleanup?.();
      disposeAudio();
    };
  }, [audioSrc, disposeAudio]);

  React.useEffect(() => {
    if (durationProp > 0) setDuration(durationProp);
  }, [durationProp]);

  const togglePlay = async () => {
    const audio = ensureAudio();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Unable to play voice message", err);
    }
  };

  const seekFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = ensureAudio();
    const rect = waveRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (!audio.duration) return;

    const clickX = e.clientX - rect.left;
    audio.currentTime = (clickX / rect.width) * audio.duration;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const durationLabel = formatDuration(duration);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        compact ? "min-w-[200px] max-w-[260px]" : "min-w-[220px] max-w-xs rounded-xl p-1",
        className,
      )}
      style={{ backgroundColor: bubbleColor }}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "shrink-0 rounded-full",
          compact ? "h-7 w-7" : "h-8 w-8",
          onGradientBubble
            ? "border-white/30 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            : "border-primary/25 bg-white text-primary hover:bg-secondary hover:text-primary",
        )}
        onClick={() => void togglePlay()}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? (
          <Pause className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        ) : (
          <Play className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        )}
      </Button>

      <div
        ref={waveRef}
        className={cn("relative flex-1 cursor-pointer", compact ? "h-5" : "h-6")}
        onClick={seekFromClick}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Voice message progress"
      >
        <div className="absolute inset-0 flex items-center justify-between px-0.5">
          {barHeights.map((height, idx) => (
            <div
              key={idx}
              className="rounded-sm"
              style={{
                width: 2,
                height: `${height}px`,
                backgroundColor: waveColor,
                opacity: 0.85,
              }}
            />
          ))}
        </div>

        <div
          className="pointer-events-none absolute left-0 top-0 h-full rounded-sm"
          style={{
            width: `${progress}%`,
            backgroundColor: waveColor,
            opacity: 0.25,
          }}
        />
      </div>

      <span
        className={cn(
          "shrink-0 text-right font-mono leading-none",
          compact ? "w-9 text-[10px]" : "w-10 text-xs",
          onGradientBubble ? "text-white/70" : "text-on-surface-variant",
        )}
      >
        {durationLabel}
      </span>
    </div>
  );
}

export default React.memo(VoiceMessageBubble);
