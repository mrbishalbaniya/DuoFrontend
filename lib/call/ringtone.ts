/** Tiny WebAudio tones so calls don't need audio files. Best effort only. */
export type ToneKind = "incoming" | "outgoing";

export function startTone(kind: ToneKind): () => void {
  if (typeof window === "undefined") return () => {};
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => {};

  let ctx: AudioContext;
  try {
    ctx = new Ctx();
  } catch {
    return () => {};
  }
  void ctx.resume().catch(() => {});

  const beep = (freqs: number[], start: number, length: number, volume: number) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.03);
    gain.gain.setValueAtTime(volume, start + length - 0.05);
    gain.gain.linearRampToValueAtTime(0, start + length);
    gain.connect(ctx.destination);
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + length);
    }
  };

  const play = () => {
    if (ctx.state === "closed") return;
    const t = ctx.currentTime + 0.05;
    if (kind === "incoming") {
      beep([880, 1320], t, 0.35, 0.12);
      beep([880, 1320], t + 0.5, 0.35, 0.12);
    } else {
      beep([440, 480], t, 1.2, 0.06);
    }
  };

  play();
  const timer = window.setInterval(play, kind === "incoming" ? 2000 : 3500);
  return () => {
    window.clearInterval(timer);
    void ctx.close().catch(() => {});
  };
}
