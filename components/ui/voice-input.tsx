"use client";

import React from "react";
import { Mic, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

interface VoiceInputProps {
  listening?: boolean;
  paused?: boolean;
  defaultListening?: boolean;
  onListeningChange?: (listening: boolean) => void;
  onStart?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  /** Prevent blur on the message input when tapping mic (mobile keyboard stays open). */
  keepComposerFocus?: boolean;
}

function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function RecordingWaveform({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-1 items-center justify-center gap-0.5 min-w-0 px-1", className)}>
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 shrink-0 rounded-full bg-primary"
          initial={{ height: 3 }}
          animate={{
            height: active ? [3, 4 + Math.random() * 14, 4 + Math.random() * 8, 3] : 3,
          }}
          transition={{
            duration: active ? 1 : 0.3,
            repeat: active ? Infinity : 0,
            delay: active ? i * 0.04 : 0,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function VoiceRecordingBar({
  active,
  visible = true,
  seconds: secondsProp,
  className,
}: {
  active: boolean;
  visible?: boolean;
  seconds?: number;
  className?: string;
}) {
  const [internalTime, setInternalTime] = React.useState(0);
  const time = secondsProp ?? internalTime;

  React.useEffect(() => {
    if (secondsProp !== undefined) return;

    if (!visible) {
      setInternalTime(0);
      return;
    }

    if (!active) return;

    const intervalId = setInterval(() => {
      setInternalTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [active, visible, secondsProp]);

  if (!visible) return null;

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", className)}>
      {active ? (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error/40 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
        </span>
      ) : (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-error/70" />
      )}
      <RecordingWaveform active={active} />
      <span className="shrink-0 font-mono text-xs tabular-nums text-on-surface-variant">
        {formatRecordingTime(time)}
      </span>
    </div>
  );
}

export function VoiceInput({
  className,
  listening: listeningProp,
  paused = false,
  defaultListening = false,
  onListeningChange,
  onStart,
  onStop,
  disabled = false,
  iconOnly = false,
  keepComposerFocus = false,
}: React.ComponentProps<"div"> & VoiceInputProps) {
  const isControlled = listeningProp !== undefined;
  const [internalListening, setInternalListening] = React.useState(defaultListening);
  const listening = isControlled ? listeningProp : internalListening;
  const [time, setTime] = React.useState(0);

  const setListening = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalListening(next);
      }
      onListeningChange?.(next);
    },
    [isControlled, onListeningChange],
  );

  React.useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (listening) {
      onStart?.();
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      onStop?.();
      setTime(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [listening, onStart, onStop]);

  const onClickHandler = () => {
    if (disabled) return;
    if (paused) {
      setListening(true);
      return;
    }
    setListening(!listening);
  };

  const ariaLabel = listening
    ? "Pause voice recording"
    : paused
      ? "Resume voice recording"
      : "Start voice recording";

  return (
    <div className={cn("flex flex-col items-center justify-center shrink-0", className)}>
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-pressed={listening}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClickHandler();
          }
        }}
        className={cn(
          "flex items-center justify-center rounded-full border border-outline-variant/50 bg-transparent p-2 text-primary transition-colors",
          (listening || paused) && "border-primary/30 bg-primary/5",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-secondary",
        )}
        layout={!iconOnly}
        transition={
          iconOnly
            ? undefined
            : {
                layout: {
                  duration: 0.4,
                },
              }
        }
        onPointerDown={keepComposerFocus ? (e) => e.preventDefault() : undefined}
        onClick={onClickHandler}
      >
        <div className="flex h-6 w-6 items-center justify-center">
          {listening ? (
            <motion.div
              className="h-4 w-4 rounded-sm bg-primary"
              animate={{
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ) : paused ? (
            <Play className="h-5 w-5 fill-primary" strokeWidth={2} />
          ) : (
            <Mic className="h-5 w-5" strokeWidth={2} />
          )}
        </div>
        <AnimatePresence mode="wait">
          {listening && !iconOnly && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{
                duration: 0.4,
              }}
              className="flex items-center justify-center gap-2 overflow-hidden"
            >
              <RecordingWaveform active={listening} className="flex-none" />
              <div className="w-10 text-center text-xs text-on-surface-variant">{formatRecordingTime(time)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
