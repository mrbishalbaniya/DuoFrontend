"use client"

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

export type StaggerTestimonial = {
  tempId: number;
  testimonial: string;
  by: string;
  imgSrc: string;
};

const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=200&h=240&fit=crop&q=80`;

/**
 * SAMPLE CONTENT: placeholder member stories for layout. Replace with real,
 * consented testimonials before launch; do not present these as genuine.
 */
const testimonials: StaggerTestimonial[] = [
  { tempId: 0, testimonial: "We matched on a Sunday and had momos together by Wednesday. A year later, we're still arguing about the best momo place.", by: "Aasha & Rohan, Kathmandu", imgSrc: unsplash("photo-1534528741775-53994a69daeb") },
  { tempId: 1, testimonial: "I liked that everyone was verified. It felt safe to actually say hello.", by: "Suman, Pokhara", imgSrc: unsplash("photo-1507003211169-0a1dd7228f2d") },
  { tempId: 2, testimonial: "Our families met over dal bhat and a very long conversation about horoscopes. Worth it.", by: "Priya, Lalitpur", imgSrc: unsplash("photo-1438761681033-6461ffad8d80") },
  { tempId: 3, testimonial: "The matches actually shared my values. No more endless swiping on people I had nothing in common with.", by: "Bikash, Bhaktapur", imgSrc: unsplash("photo-1500648767791-00dcc994a43e") },
  { tempId: 4, testimonial: "I set Korean as a language I'm learning. My match was learning it too. We now practise together every night.", by: "Anisha, Chitwan", imgSrc: unsplash("photo-1544005313-94ddf0286df2") },
  { tempId: 5, testimonial: "Serious about marriage and so was she. Duo made that clear from the first message.", by: "Nabin, Butwal", imgSrc: unsplash("photo-1506794778202-cad84cf45f1d") },
  { tempId: 6, testimonial: "I was nervous about online dating. The selfie verification made all the difference.", by: "Sarita, Dharan", imgSrc: unsplash("photo-1494790108377-be9c29b29330") },
  { tempId: 7, testimonial: "We both love trekking. Our first date was the Poon Hill trail. Our second was too.", by: "Kiran, Pokhara", imgSrc: unsplash("photo-1519085360753-af0119f7cbe7") },
  { tempId: 8, testimonial: "Simple, respectful and actually works. I told all my friends.", by: "Mina, Biratnagar", imgSrc: unsplash("photo-1531746020798-e6953c6e8e04") },
  { tempId: 9, testimonial: "Found someone who laughs at my terrible jokes. That's all I wanted.", by: "Arjun, Kathmandu", imgSrc: unsplash("photo-1539571696357-5a69c17a67c6") },
];

// Theme colours set inline (the original's bg-card and hsl(var(--border)) don't
// exist in this theme, and inline values also survive a stale cached stylesheet).
const CARD_BG = "var(--color-surface-container, var(--color-background))";
const BORDER = "var(--color-border)";

interface TestimonialCardProps {
  position: number;
  testimonial: StaggerTestimonial;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
        isCenter
          ? "z-10 text-white"
          : "z-0 text-on-surface hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        background: isCenter ? "linear-gradient(135deg, var(--color-primary), #e8804f)" : CARD_BG,
        borderColor: isCenter ? "var(--color-primary)" : BORDER,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? `0px 8px 0px 4px ${BORDER}` : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
          backgroundColor: BORDER
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={testimonial.imgSrc}
        alt={`${testimonial.by.split(',')[0]}`}
        className="mb-4 h-14 w-12 object-cover object-top"
        style={{
          backgroundColor: "var(--color-muted)",
          boxShadow: "3px 3px 0px var(--color-background)"
        }}
      />
      <h3 className={cn(
        "text-base sm:text-xl font-medium",
        isCenter ? "text-white" : "text-on-surface"
      )}>
        &ldquo;{testimonial.testimonial}&rdquo;
      </h3>
      <p className={cn(
        "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
        isCenter ? "text-white/80" : "text-on-surface-variant"
      )}>
        - {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC<{ items?: StaggerTestimonial[] }> = ({ items = testimonials }) => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(items);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const navButton = cn(
    "flex h-14 w-14 items-center justify-center text-2xl text-on-surface transition-colors",
    "border-2 hover:bg-primary hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 600 }}
    >
      {testimonialsList.map((testimonial, index) => {
        const position = testimonialsList.length % 2
          ? index - (testimonialsList.length + 1) / 2
          : index - testimonialsList.length / 2;
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={navButton}
          style={{ backgroundColor: "var(--color-background)", borderColor: BORDER }}
          aria-label="Previous testimonial"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={navButton}
          style={{ backgroundColor: "var(--color-background)", borderColor: BORDER }}
          aria-label="Next testimonial"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};
