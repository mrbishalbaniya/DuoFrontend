"use client";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
export function HeroSection03() {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] [background-size:20px_20px] bg-[radial-gradient(circle,rgba(255,255,255,0.35)_1px,transparent_1px)]"
        aria-hidden
      />

      <div className="relative z-10 px-4 sm:px-8 md:px-12 pt-8 pb-8 sm:pt-10 md:pt-16 md:pb-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-center gap-0.5 sm:gap-0 md:items-center">
          <div className="flex w-full flex-col items-start gap-3 sm:gap-2 md:flex-row md:items-center md:gap-6">
            <p className="max-w-full text-start text-xs leading-5 text-muted-foreground sm:max-w-[220px] md:max-w-[200px] md:text-right md:text-sm">
              Duo blends deep-rooted tradition with intelligent matching for
              meaningful, lasting connections.
            </p>
            <h1 className="text-4xl font-light leading-[0.9] tracking-wide text-on-surface sm:text-6xl sm:leading-[0.9] sm:tracking-wider md:text-7xl xl:text-[9rem]">
              FIND YOUR
            </h1>
          </div>

          <div className="flex w-full flex-col items-start gap-3 sm:gap-2 md:flex-row md:items-center md:gap-6 md:-mt-1">
            <h1 className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-0 text-4xl font-light leading-[0.9] tracking-wide text-on-surface sm:text-6xl sm:leading-[0.9] sm:tracking-wider md:flex-nowrap md:text-7xl xl:text-[9rem]">
              <span>LIFE</span>
              <Heart
                className="size-8 shrink-0 fill-primary text-primary sm:mx-1 sm:size-12 md:mx-2 md:size-20 lg:size-36 xl:size-40"
                strokeWidth={1.5}
                aria-hidden
              />
              <span>PARTNER</span>
            </h1>
            <motion.p
              className="max-w-full pt-1 text-xs leading-5 text-muted-foreground sm:max-w-[250px] md:max-w-[200px] md:self-center md:pt-0 md:text-sm"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
            >
              Open to every story — whether you are searching for love, family,
              or a second chapter.
            </motion.p>
          </div>

          <div className="-mt-1 flex w-full flex-col items-start md:-mt-3 md:flex-row md:items-center md:gap-6">
            <h1 className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-0 text-4xl font-light leading-[0.9] tracking-wide text-on-surface sm:text-6xl sm:leading-[0.9] sm:tracking-wider md:text-7xl xl:text-[9rem]">
              <span>MATCH</span>
              <Heart
                className="mx-1 hidden size-28 shrink-0 fill-primary text-primary lg:block xl:size-36"
                strokeWidth={1.5}
                aria-hidden
              />
              <Heart
                className="size-8 shrink-0 fill-primary text-primary sm:size-10 lg:hidden"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="text-gradient-brand">INTUITIVE</span>
            </h1>
          </div>
        </div>

        <div className="mx-auto mt-8 w-full max-w-7xl sm:mt-10 sm:px-2">
          <div className="flex flex-col items-start gap-3 md:mx-8 md:flex-row md:items-center md:justify-end md:gap-4">
            <Separator className="my-2 w-full max-w-3xl sm:my-4 md:my-6" />
            <div className="text-xs text-muted-foreground sm:text-sm">
              KATHMANDU, NEPAL
            </div>
            <div className="flex w-full flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-xl font-thin text-on-surface sm:text-2xl md:text-4xl">
                MATCHMAKING
              </span>
              <span className="text-2xl font-bold italic text-accent sm:text-3xl md:text-5xl">
                duo
              </span>
            </div>
          </div>
        </div>

        <div
          className="fixed right-0 top-1/2 z-20 hidden -translate-y-1/2 items-center md:flex"
          aria-hidden
        >
          <div className="bg-foreground px-3 py-6 text-sm font-bold text-background">
            <span className="rotate-180 [writing-mode:vertical-rl] tracking-widest">
              Verified Profiles
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
