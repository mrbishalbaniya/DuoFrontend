"use client";

import React from "react";

interface LoaderProps {
  pageName?: string;
}

export default function Loader({ pageName }: LoaderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12 mx-auto">
        {/* Box */}
        <div className="absolute w-full h-full bg-[#f08080] rounded-md animate-box-jump" />
      </div>

      <p className="text-sm text-on-surface-variant">
        Please wait, {pageName ? `${pageName} is` : "this page is"} loading…
      </p>

      {/* Tailwind keyframe styles */}
      <style>{`
        @keyframes box-jump {
          15% {
            border-bottom-right-radius: 3px;
          }
          25% {
            transform: translateY(9px) rotate(22.5deg);
          }
          50% {
            transform: translateY(18px) scale(1, 0.9) rotate(45deg);
            border-bottom-right-radius: 40px;
          }
          75% {
            transform: translateY(9px) rotate(67.5deg);
          }
          100% {
            transform: translateY(0) rotate(90deg);
          }
        }

        @keyframes shadow-jump {
          0%, 100% {
            transform: scale(1, 1);
          }
          50% {
            transform: scale(1.2, 1);
          }
        }

        .animate-box-jump {
          animation: box-jump 0.5s linear infinite;
        }

        .animate-shadow-jump {
          animation: shadow-jump 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
