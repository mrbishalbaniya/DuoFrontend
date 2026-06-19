"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const LAMP_BG = "bg-background";

export function LampDemo() {
  return (
    <LampContainer>
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
        className="premium-section-label"
      >
        Begin Your Journey
      </motion.p>
      <motion.h2
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-2 bg-gradient-to-br from-white via-primary-fixed-dim to-accent bg-clip-text py-2 text-center text-3xl font-[var(--font-headline)] font-extrabold tracking-tight text-transparent sm:text-4xl md:text-5xl lg:text-6xl"
      >
        Your story begins
        <br />
        with a single hello.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.7, ease: "easeInOut" }}
        className="mt-2 max-w-xl text-center text-base leading-relaxed text-on-surface-variant sm:text-lg"
      >
        Join the most trusted community for meaningful connections today. Registration is free and
        takes less than 2 minutes.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.7, ease: "easeInOut" }}
        className="mt-8"
      >
        <Link
          href="/register"
          className="btn-premium px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg"
        >
          Create Your Free Profile
        </Link>
      </motion.div>
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative z-0 w-full overflow-hidden bg-background",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-52 w-full sm:h-56">
        <div className="relative mx-auto h-full w-full max-w-[100vw] scale-y-110">
          <motion.div
            initial={{ opacity: 0.5, width: "15rem" }}
            whileInView={{ opacity: 1, width: "30rem" }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            style={{
              backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
            }}
            className="absolute top-0 right-1/2 h-56 w-[30rem] overflow-visible bg-gradient-conic from-primary via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
          >
            <div
              className={cn(
                "absolute bottom-0 left-0 z-20 h-40 w-full [mask-image:linear-gradient(to_top,white,transparent)]",
                LAMP_BG
              )}
            />
            <div
              className={cn(
                "absolute bottom-0 left-0 z-20 h-full w-40 [mask-image:linear-gradient(to_right,white,transparent)]",
                LAMP_BG
              )}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0.5, width: "15rem" }}
            whileInView={{ opacity: 1, width: "30rem" }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            style={{
              backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
            }}
            className="absolute top-0 left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-accent text-white [--conic-position:from_290deg_at_center_top]"
          >
            <div
              className={cn(
                "absolute bottom-0 right-0 z-20 h-full w-40 [mask-image:linear-gradient(to_left,white,transparent)]",
                LAMP_BG
              )}
            />
            <div
              className={cn(
                "absolute bottom-0 right-0 z-20 h-40 w-full [mask-image:linear-gradient(to_top,white,transparent)]",
                LAMP_BG
              )}
            />
          </motion.div>
          <div className="absolute left-0 top-10 h-40 w-full scale-x-150 bg-gradient-to-b from-background via-background/60 to-transparent blur-2xl" />
          <div className="absolute left-0 top-10 z-50 h-40 w-full bg-transparent opacity-10 backdrop-blur-md" />
          <div className="absolute left-1/2 top-8 z-50 h-36 w-[28rem] max-w-[92vw] -translate-x-1/2 rounded-full bg-primary opacity-50 blur-3xl" />
          <motion.div
            initial={{ width: "8rem" }}
            whileInView={{ width: "16rem" }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-8 z-30 h-36 w-64 -translate-x-1/2 translate-y-2 rounded-full bg-primary opacity-80 blur-2xl"
          />
          <motion.div
            initial={{ width: "15rem" }}
            whileInView={{ width: "30rem" }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-4 z-50 h-0.5 w-[30rem] max-w-[min(30rem,92vw)] -translate-x-1/2 bg-accent shadow-[0_0_12px_rgba(212,165,116,0.65)]"
          />
        </div>
      </div>

      <div className="relative z-50 flex flex-col items-center px-5 pt-9 pb-8 sm:pt-10">
        {children}
      </div>
    </div>
  );
};
