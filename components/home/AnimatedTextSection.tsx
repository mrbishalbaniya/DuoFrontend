"use client";

import TextBlockAnimation from "@/components/ui/text-block-animation";
import { ArrowDown } from "lucide-react";

export default function AnimatedTextSection() {
  return (
    <div className="w-full bg-surface text-on-surface">
      
      {/* Main Content */}
      <div className="flex flex-col">
        
        {/* 1. HERO: The Hook */}
        <section className="min-h-screen flex flex-col items-center justify-center relative px-6">
          <div className="max-w-4xl w-full">
            <TextBlockAnimation
              blockColor="#e84a7a"
              animateOnScroll={false}
              delay={0.2}
              duration={0.8}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-tight font-[var(--font-headline)]">
                Don&apos;t just swipe.<br />
                <span className="inline-block bg-primary text-white px-3 pb-1 rounded-md mt-2">
                  Connect.
                </span>
              </h1>
            </TextBlockAnimation>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-60">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant">
              Scroll to Reveal
            </span>
            <ArrowDown className="w-5 h-5 text-on-surface-variant animate-bounce" />
          </div>
        </section>

        {/* 2. THE PITCH */}
        <section className="min-h-[80vh] flex flex-col justify-center items-center px-6 py-24 premium-card-subtle">
          <div className="max-w-3xl w-full space-y-16">
            <TextBlockAnimation blockColor="#d4a574" duration={0.7}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-[var(--font-headline)]">
                This is what makes us different.
              </h2>
            </TextBlockAnimation>

            <TextBlockAnimation blockColor="#ff4d6d" stagger={0.03}>
              <p className="text-lg md:text-2xl leading-relaxed text-on-surface-variant">
                You stopped scrolling because something felt <strong>real</strong>.
                That&apos;s the power of <strong>authenticity</strong> and <strong>genuine connection</strong>.
                We build relationships that last, not just matches that fade.
              </p>
            </TextBlockAnimation>

            <div className="pl-6 border-l-2 border-primary">
              <TextBlockAnimation blockColor="#8b5cf6" duration={0.6}>
                <p className="text-base md:text-lg italic text-on-surface-variant">
                  &quot;If you&apos;re ready for something meaningful, we should connect.&quot;
                </p>
              </TextBlockAnimation>
            </div>
          </div>
        </section>

        {/* 3. FOOTER: Call to Action */}
        <section className="min-h-[60vh] flex items-center justify-center border-t border-primary/10 bg-surface-container px-6 py-16">
          <div className="max-w-3xl w-full text-center space-y-8">
            <TextBlockAnimation blockColor="#e84a7a" duration={0.7}>
              <p className="text-sm md:text-base uppercase tracking-widest text-accent font-bold">
                Begin Your Journey
              </p>
            </TextBlockAnimation>

            <TextBlockAnimation blockColor="#d4a574" duration={0.8} delay={0.2}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-[var(--font-headline)] text-on-surface">
                Your story begins<br />
                with a single hello.
              </h2>
            </TextBlockAnimation>

            <TextBlockAnimation blockColor="#ff4d6d" duration={0.6} delay={0.4}>
              <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
                Join the most trusted community for meaningful connections today. Registration is free and takes less than 2 minutes.
              </p>
            </TextBlockAnimation>

            <TextBlockAnimation blockColor="#8b5cf6" duration={0.7} delay={0.6}>
              <a
                href="/register"
                className="btn-premium inline-block text-base md:text-lg"
              >
                Create Your Free Profile
              </a>
            </TextBlockAnimation>
          </div>
        </section>
      </div>
    </div>
  );
}
