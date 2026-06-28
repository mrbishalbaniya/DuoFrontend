"use client";

import type { PhotoAnalysis, PhotoAnalysisStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PhotoAnalysisStatus, string> = {
  APPROVED: "text-emerald-400",
  WARNING: "text-amber-400",
  REJECTED: "text-red-400",
};

interface PhotoAnalysisResultProps {
  analysis: PhotoAnalysis;
  className?: string;
}

function CheckRow({
  ok,
  label,
  warn,
}: {
  ok: boolean;
  label: string;
  warn?: boolean;
}) {
  const icon = ok ? "check_circle" : warn ? "warning" : "cancel";
  const tone = ok ? "text-emerald-400" : warn ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn("material-symbols-outlined text-[20px]", tone)}
        style={ok ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className="text-on-surface">{label}</span>
    </div>
  );
}

export function PhotoAnalysisResult({ analysis, className }: PhotoAnalysisResultProps) {
  const singlePerson =
    analysis.face_count === 1
      ? true
      : analysis.face_count > 1
        ? false
        : analysis.face_detected;
  const highQuality = analysis.blur_score >= 120 && analysis.resolution_passed;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-surface-container-high/80 p-4 shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-headline)] text-base font-semibold text-on-surface">
          Photo analysis
        </h3>
        <span className={cn("text-sm font-bold", STATUS_STYLES[analysis.status])}>
          {analysis.status}
        </span>
      </div>

      <div className="space-y-2">
        <CheckRow ok={analysis.face_detected} label="Face detected" />
        <CheckRow
          ok={singlePerson === true}
          warn={analysis.face_count > 1}
          label={analysis.face_count > 1 ? "Multiple people detected" : "Single person"}
        />
        <CheckRow ok={highQuality} warn={!highQuality && analysis.face_detected} label="High quality" />
        <CheckRow
          ok={analysis.face_centered}
          warn={analysis.face_detected && !analysis.face_centered}
          label="Face centered"
        />
      </div>

      <div className="mt-4 rounded-xl bg-black/25 px-3 py-2">
        <p className="text-xs text-on-surface-variant">Quality score</p>
        <p className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">
          {analysis.quality_score}
          <span className="text-base font-medium text-on-surface-variant">/100</span>
        </p>
      </div>

      {analysis.warnings.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-amber-300/90">
          {analysis.warnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      ) : null}

      {analysis.rejection_reasons.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-red-300/90">
          {analysis.rejection_reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
