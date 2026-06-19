import type { ReactNode } from "react";
import type { ProfileField } from "@/lib/profile/formatProfile";

interface ProfileDataSectionProps {
  title: string;
  icon: string;
  fields?: ProfileField[];
  children?: ReactNode;
}

export function ProfileDataSection({
  title,
  icon,
  fields,
  children,
}: ProfileDataSectionProps) {
  return (
    <section className="bg-background rounded-2xl sm:rounded-[2rem] border border-primary/10 p-6 sm:p-8 shadow-[0_4px_20px] shadow-primary/6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h2 className="text-xl font-bold font-[var(--font-headline)] text-on-surface">{title}</h2>
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
