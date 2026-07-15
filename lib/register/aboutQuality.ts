/** Truncate on sentence end so generated text never cuts mid-sentence. */
export function truncateAtSentence(text: string, maxChars: number): string {
  const value = (text || "").trim();
  if (value.length <= maxChars) return value;

  const parts = value.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const part of parts) {
    const trial = [...kept, part].join(" ").trim();
    if (kept.length > 0 && trial.length > maxChars) break;
    if (kept.length === 0 && part.length > maxChars) {
      const clipped = part.slice(0, maxChars - 1).replace(/\s+\S*$/, "").replace(/[,;.]+$/, "");
      return clipped ? `${clipped}.` : part.slice(0, maxChars);
    }
    kept.push(part);
  }
  return kept.join(" ").trim();
}

export type ProfileQualityLevel = "excellent" | "good" | "needs_more";

export type ProfileQuality = {
  level: ProfileQualityLevel;
  label: string;
  score: number;
};

function uniqueWordCount(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  return new Set(words).size;
}

function sentenceCount(text: string): number {
  const parts = text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length;
}

/** Lightweight, offline quality score — no AI required. */
export function assessWritingQuality(text: string, opts: { minChars: number; maxChars: number }): ProfileQuality {
  const value = text.trim();
  const length = value.length;
  if (!length) {
    return { level: "needs_more", label: "Needs More Detail", score: 0 };
  }

  const unique = uniqueWordCount(value);
  const sentences = sentenceCount(value);
  let score = 0;

  // Length progress toward a solid answer
  const lengthTarget = Math.min(opts.maxChars * 0.55, Math.max(opts.minChars * 2.2, opts.minChars + 60));
  score += Math.min(45, (length / lengthTarget) * 45);

  // Lexical variety
  score += Math.min(30, (unique / 28) * 30);

  // Sentence structure
  if (sentences >= 3) score += 20;
  else if (sentences === 2) score += 12;
  else if (sentences === 1 && length >= opts.minChars) score += 6;

  if (length < opts.minChars) score = Math.min(score, 38);
  if (length > opts.maxChars) score = Math.min(score, 55);

  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  if (rounded >= 75) return { level: "excellent", label: "Excellent", score: rounded };
  if (rounded >= 50) return { level: "good", label: "Good", score: rounded };
  return { level: "needs_more", label: "Needs More Detail", score: rounded };
}
