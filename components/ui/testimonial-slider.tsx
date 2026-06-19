"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  img: string;
  quote: string;
  name: string;
  role: string;
}

export const DUO_TESTIMONIALS: Testimonial[] = [
  {
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=112&h=112&fit=crop&q=80",
    quote:
      "Duo helped us find each other across cultures — thoughtful matching that actually understands what matters.",
    name: "Anika S.",
    role: "Kathmandu",
  },
  {
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=112&h=112&fit=crop&q=80",
    quote:
      "The compatibility insights saved us months of guessing. We knew we were aligned before our first coffee.",
    name: "Rohan K.",
    role: "Lalitpur",
  },
  {
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=112&h=112&fit=crop&q=80",
    quote:
      "Secure chat and verified profiles gave my family peace of mind. Duo feels premium and genuinely safe.",
    name: "Priya M.",
    role: "Pokhara",
  },
];

export function TestimonialSlider({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [autorotate, setAutorotate] = useState(true);
  const autorotateTiming = 7000;

  const heightFix = useCallback(() => {
    if (testimonialsRef.current?.parentElement) {
      testimonialsRef.current.parentElement.style.height = `${testimonialsRef.current.clientHeight}px`;
    }
  }, []);

  useEffect(() => {
    heightFix();
  }, [heightFix]);

  useEffect(() => {
    if (!autorotate) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1 === testimonials.length ? 0 : prev + 1));
    }, autorotateTiming);
    return () => clearInterval(interval);
  }, [autorotate, testimonials.length]);

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden px-1 text-center">
      <div className="relative mx-auto h-28 w-full max-w-[min(100%,20rem)] sm:h-32">
        <div className="pointer-events-none absolute left-1/2 top-0 aspect-square w-[min(100vw,30rem)] max-w-full -translate-x-1/2 before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-b before:from-primary/25 before:via-primary/5 before:via-25% before:to-primary/0 before:to-75%">
          <div className="h-28 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.2)_20%,white)] sm:h-32">
            {testimonials.map((testimonial, index) => (
              <Transition
                as="div"
                key={testimonial.name}
                show={active === index}
                className="absolute inset-0 -z-10 h-full"
                enter="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700 order-first"
                enterFrom="opacity-0 -rotate-[60deg]"
                enterTo="opacity-100 rotate-0"
                leave="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700"
                leaveFrom="opacity-100 rotate-0"
                leaveTo="opacity-0 rotate-[60deg]"
                beforeEnter={heightFix}
              >
                <Image
                  className="relative left-1/2 top-11 -translate-x-1/2 rounded-full border-2 border-primary/30 object-cover"
                  src={testimonial.img}
                  width={56}
                  height={56}
                  alt={testimonial.name}
                />
              </Transition>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-9 transition-all delay-300 duration-150 ease-in-out">
        <div className="relative flex flex-col" ref={testimonialsRef}>
          {testimonials.map((testimonial, index) => (
            <Transition
              key={testimonial.name}
              show={active === index}
              enter="transition ease-in-out duration-500 delay-200 order-first"
              enterFrom="opacity-0 -translate-x-4"
              enterTo="opacity-100 translate-x-0"
              leave="transition ease-out duration-300 delay-300 absolute"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-4"
              beforeEnter={heightFix}
            >
              <div className="px-2 font-[var(--font-headline)] text-lg font-bold leading-snug text-on-surface sm:px-0 sm:text-xl md:text-2xl before:content-['\201C'] after:content-['\201D']">
                {testimonial.quote}
              </div>
            </Transition>
          ))}
        </div>
      </div>

      <div className="-m-1 flex flex-wrap justify-center gap-1 px-1 sm:-m-1.5 sm:gap-0">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.name}
            type="button"
            className={cn(
              "m-1 inline-flex max-w-full justify-center rounded-full px-2.5 py-1.5 text-[11px] shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:m-1.5 sm:px-3 sm:text-xs",
              active === index
                ? "bg-primary text-white shadow-primary/20"
                : "border border-white/10 bg-secondary-container text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
            )}
            onClick={() => {
              setActive(index);
              setAutorotate(false);
            }}
          >
            <span>{testimonial.name}</span>{" "}
            <span className={active === index ? "text-primary-fixed-dim" : "text-primary/50"}>
              -
            </span>{" "}
            <span>{testimonial.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DuoTestimonialsSection() {
  return (
    <section className="overflow-hidden border-t border-white/[0.04] px-4 py-14 sm:px-6 sm:py-16 md:py-20">
      <div className="mx-auto mb-8 max-w-7xl space-y-4 text-center sm:mb-10 md:mb-12">
        <p className="premium-section-label">Real Stories</p>
        <h2 className="text-2xl font-[var(--font-headline)] font-extrabold text-on-surface sm:text-3xl md:text-4xl">
          Loved by couples across Nepal
        </h2>
        <div className="premium-divider" />
      </div>
      <TestimonialSlider testimonials={DUO_TESTIMONIALS} />
    </section>
  );
}
