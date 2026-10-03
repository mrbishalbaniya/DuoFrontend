"use client";

import React, { useState, useEffect, useRef } from 'react';

const slides = [
  {
    title: "Find Your Perfect Match",
    description: "Our AI-powered matching algorithm analyzes 150+ compatibility factors including cultural values, life goals, and personality traits.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
    color: "#e84a7a",
  },
  {
    title: "Verified Profiles Only",
    description: "Every profile goes through our multi-step verification process including photo verification and identity checks.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
    color: "#d4a574",
  },
  {
    title: "Privacy-First Messaging",
    description: "Your conversations are protected with end-to-end encryption. Share what you want, when you want.",
    image: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=800",
    color: "#ff4d6d",
  },
  {
    title: "Success Stories Begin Here",
    description: "Join thousands of couples who found their life partners through Duo. Real connections, lasting relationships.",
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800",
    color: "#8b5cf6",
  },
];

export function ScrollingFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Check if section is in viewport
      if (sectionTop <= 0 && sectionTop + sectionHeight >= windowHeight) {
        // Calculate progress through section
        const scrolled = Math.abs(sectionTop);
        const scrollableHeight = sectionHeight - windowHeight;
        const progress = scrolled / scrollableHeight;
        
        // Determine active slide
        const index = Math.min(
          slides.length - 1,
          Math.floor(progress * slides.length)
        );
        
        setActiveIndex(index);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${slides.length * 100}vh` }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#25272b] to-[#17181a] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
          
          {/* Left: Content */}
          <div className="relative flex flex-col justify-center">
            
            {/* Dots */}
            <div className="absolute top-4 sm:top-8 lg:top-16 left-0 flex gap-2 z-10">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === activeIndex ? '48px' : '24px',
                    background: i === activeIndex ? slide.color : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>

            {/* Title & Description */}
            <div className="space-y-4 sm:space-y-6 mt-12 sm:mt-16 lg:mt-0">
              <h2 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white transition-all duration-700 font-[var(--font-headline)] leading-tight"
                style={{
                  textShadow: `0 0 40px ${slides[activeIndex].color}40`,
                }}
              >
                {slides[activeIndex].title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-lg transition-all duration-700 leading-relaxed">
                {slides[activeIndex].description}
              </p>
            </div>

            {/* Button */}
            <div className="absolute bottom-4 sm:bottom-8 lg:bottom-16 left-0">
              <a
                href="/register"
                className="btn-premium inline-block text-sm sm:text-base transition-all duration-700"
                style={{
                  background: `linear-gradient(135deg, ${slides[activeIndex].color}, ${slides[activeIndex].color}dd)`,
                }}
              >
                Get Started
              </a>
            </div>
          </div>

          {/* Right: Image */}
          <div className="hidden lg:flex items-center justify-center relative">
            
            {/* Glow effect */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700"
              style={{
                filter: 'blur(100px)',
                opacity: 0.15,
              }}
            >
              <div 
                className="w-3/4 h-3/4 rounded-full transition-all duration-700"
                style={{ background: slides[activeIndex].color }}
              />
            </div>

            {/* Image */}
            <div className="relative w-[65%] aspect-[9/16] max-h-[75vh] rounded-3xl overflow-hidden shadow-2xl z-10">
              <img
                key={activeIndex}
                src={slides[activeIndex].image}
                alt={slides[activeIndex].title}
                className="w-full h-full object-cover transition-opacity duration-700"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
