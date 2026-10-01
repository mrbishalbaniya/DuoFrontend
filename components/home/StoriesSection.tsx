import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";

/** Member stories carousel, below the profile stream on the home page. */
export function StoriesSection() {
  return (
    <section aria-labelledby="stories-title" className="bg-surface pb-10 pt-16 sm:pt-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Love stories</p>
        <h2
          id="stories-title"
          className="mt-3 text-balance font-[var(--font-headline)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl"
        >
          It started with a match.
        </h2>
      </div>
      <StaggerTestimonials />
    </section>
  );
}
