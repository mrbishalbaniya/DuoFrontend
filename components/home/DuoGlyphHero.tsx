"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlyphPortal from "@/components/ui/glyph-portal";

/**
 * Landing hero: the word "DUO" is a window onto a couple photo. Scrolling
 * zooms through the letter into the photo, then reveals the pitch and CTAs.
 * Colours follow the app theme (surface / primary tokens), light and dark.
 */

// Unsplash photo: hands making a heart at sunset (free under the Unsplash licence).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=2000&q=80";

const FALLBACK_FONT = '"Arial Black", Arial, sans-serif';

/**
 * The portal freezes motion if any face in its font stack isn't loaded, and
 * next/font stacks include a synthetic "… Fallback" face that never is. So wait
 * for fonts, then pass only the real headline family (or a system fallback).
 */
function useHeadlineFont(): string | null {
  const [font, setFont] = useState<string | null>(null);
  useEffect(() => {
    let settled = false;
    const finish = (value: string) => {
      if (!settled) {
        settled = true;
        setFont(value);
      }
    };
    const timeout = window.setTimeout(() => finish(FALLBACK_FONT), 1600);
    void document.fonts.ready.then(() => {
      const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-headline");
      const first = (stack.match(/(?:"[^"]*"|'[^']*'|[^,]+)/) ?? [""])[0].trim();
      const loaded = first && document.fonts.check(`900 100px ${first}`, "DUO");
      finish(loaded ? `${first}, ${FALLBACK_FONT}` : FALLBACK_FONT);
    });
    return () => {
      settled = true;
      window.clearTimeout(timeout);
    };
  }, []);
  return font;
}

/**
 * `overflow-x: hidden` on <body> makes it a scroll container (overflow-y
 * computes to auto) that never scrolls, so the portal's sticky pin would stick
 * to <body> and never pin. `clip` hides sideways overflow the same way without
 * creating a scroll container. Applied while the hero is mounted.
 */
function useStickyFriendlyBody() {
  useEffect(() => {
    const body = document.body;
    const previous = body.style.overflowX;
    body.style.overflowX = "clip";
    return () => {
      body.style.overflowX = previous;
    };
  }, []);
}

export function DuoGlyphHero() {
  useStickyFriendlyBody();
  const font = useHeadlineFont();
  return (
    <div data-duo-hero>
      <style>{`
        [data-duo-hero] [data-gp-caption]{inset:calc(var(--gp-word-bottom,50%) + 88px) 24px auto;justify-content:center;}
        [data-duo-hero] [data-gp-hint]{display:none;}
        [data-duo-hero] [data-gp-enter]{min-height:48px;padding:0 24px;gap:14px;border-radius:999px;color:#fff;font-size:14px;font-weight:700;
          background:linear-gradient(135deg,var(--color-primary),#e8804f);box-shadow:0 10px 30px rgba(232,74,122,.3);transition:transform .18s,box-shadow .18s;}
        [data-duo-hero] [data-gp-enter]:hover{transform:translateY(-1px);box-shadow:0 14px 36px rgba(232,74,122,.4);}
        [data-duo-hero] [data-gp-touch-picker]{top:auto;bottom:18px;}
        [data-duo-hero] [data-gp-select]{border-color:transparent;border-radius:10px;font-size:12px;}
        [data-duo-eyebrow]{position:absolute;inset:auto 24px calc(100% - var(--gp-word-top,35%) + 28px);margin:0;text-align:center;
          font-size:12px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--color-primary);}
        [data-duo-support]{position:absolute;inset:calc(var(--gp-word-bottom,50%) + 28px) 24px auto;margin:0;text-align:center;
          font-size:clamp(15px,1.4vw,18px);line-height:1.5;color:var(--color-on-surface-variant);}
        [data-duo-scroll]{position:absolute;inset:auto 24px 6%;text-align:center;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-on-surface-variant);opacity:.8;}
        @media(any-pointer:coarse){[data-duo-scroll]{bottom:13%;}}
        [data-duo-hero] [data-gp-content]{padding:6rem clamp(1.25rem,6vw,6rem);}
        [data-duo-copy]{display:flex;width:min(100%,72rem);margin:auto;flex-direction:column;align-items:flex-start;gap:clamp(1.5rem,4svh,2.75rem);
          text-shadow:0 2px 18px rgba(0,0,0,.45);}
        [data-duo-copy] h2{margin:0;max-width:44rem;font-family:var(--font-headline);font-size:clamp(2rem,1.2rem + 3vw,3.75rem);font-weight:800;line-height:1.08;letter-spacing:-.02em;}
        [data-duo-copy] p{margin:0;max-width:36rem;font-size:clamp(1rem,.9rem + .4vw,1.2rem);line-height:1.6;color:rgba(255,255,255,.9);}
        [data-duo-ctas]{display:flex;flex-wrap:wrap;gap:12px;}
        [data-duo-ctas] a{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 26px;border-radius:999px;font-weight:700;text-decoration:none;text-shadow:none;transition:transform .18s;}
        [data-duo-ctas] a:hover{transform:translateY(-1px);}
        [data-duo-primary]{color:#fff;background:linear-gradient(135deg,var(--color-primary),#e8804f);box-shadow:0 10px 30px rgba(232,74,122,.35);}
        [data-duo-secondary]{color:#fff;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.08);backdrop-filter:blur(8px);}
        [data-duo-points]{display:grid;width:100%;grid-template-columns:1fr;gap:1.25rem;margin-top:.5rem;}
        [data-duo-point]{border-top:1px solid rgba(255,255,255,.28);padding-top:1rem;}
        [data-duo-point] h3{margin:0;font-size:1.05rem;font-weight:700;}
        [data-duo-point] p{margin:.4rem 0 0;font-size:.95rem;color:rgba(255,255,255,.85);}
        @media(min-width:768px){[data-duo-points]{grid-template-columns:repeat(3,minmax(0,1fr));gap:2.5rem;}}
      `}</style>
      {font ? (
      <GlyphPortal
        word="DUO"
        fontFamily={font}
        fontWeight={900}
        scrollLength={2.2}
        interactive
        enterLabel="Find your person"
        style={{
          "--gp-paper": "var(--color-surface)",
          "--gp-ink": "var(--color-on-surface)",
          "--gp-field": "#1a0d14",
          "--gp-foreground": "#ffffff",
          fontFamily: "inherit",
        }}
        background={
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "scale(var(--gp-field-scale,1))",
              backgroundImage: `linear-gradient(180deg, rgba(20,6,14,.15) 0%, rgba(20,6,14,.55) 70%, rgba(20,6,14,.85) 100%), url("${HERO_PHOTO}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        }
        front={
          <>
            <p data-duo-eyebrow>Find your life partner</p>
            <p data-duo-support>Tradition meets smart matching. Real people, verified profiles.</p>
            <span data-duo-scroll>Scroll to step inside ↓</span>
          </>
        }
      >
        <div data-duo-copy>
          <h2>Where meaningful connections begin.</h2>
          <p>
            Duo blends deep-rooted tradition with intelligent matching, so you meet people who share
            your values, goals and way of life.
          </p>
          <div data-duo-ctas>
            <Link href="/register" data-duo-primary>
              Create your profile
            </Link>
            <Link href="/login" data-duo-secondary>
              I already have an account
            </Link>
          </div>
          <div data-duo-points>
            <div data-duo-point>
              <h3>Verified people</h3>
              <p>Selfie verification keeps profiles real.</p>
            </div>
            <div data-duo-point>
              <h3>Matches that fit</h3>
              <p>Ranked by your goals, background and lifestyle.</p>
            </div>
            <div data-duo-point>
              <h3>Private by design</h3>
              <p>Your contact details are never on your profile.</p>
            </div>
          </div>
        </div>
      </GlyphPortal>
      ) : (
        <div style={{ height: "100svh" }} aria-hidden />
      )}
    </div>
  );
}
