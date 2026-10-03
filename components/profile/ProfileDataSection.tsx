import type { ReactNode } from "react";
import type { ProfileField } from "@/lib/profile/formatProfile";

interface ProfileDataSectionProps {
  title: string;
  icon: string;
  fields?: ProfileField[];
  children?: ReactNode;
  /** Shows an Edit button in the header for per-section editing. */
  onEdit?: () => void;
}

export function ProfileDataSection({
  title,
  icon,
  fields,
  children,
  onEdit,
}: ProfileDataSectionProps) {
  return (
    <section className="bg-background rounded-2xl sm:rounded-[2rem] border border-primary/10 p-6 sm:p-8 shadow-[0_4px_20px] shadow-primary/6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h2 className="flex-1 text-xl font-bold font-[var(--font-headline)] text-on-surface">{title}</h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit
          </button>
        ) : null}
      </div>

      {fields ? (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="rounded-xl bg-secondary/40 p-4">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-accent">
                {field.label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium leading-relaxed text-on-surface break-words">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children}
    </section>
  );
}
