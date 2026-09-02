"use client";

import { useState } from "react";
import { SecurityPageShell } from "@/components/security/SecurityPageShell";

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "How does matching work?",
    a: "Swipe right (or tap like) on profiles you're interested in. If they like you back, it's a match and you can start chatting. Your Discovery preferences in Settings control who you see.",
  },
  {
    q: "How do I get verified?",
    a: "Go to Settings > Verify your profile and take a quick selfie. Verified profiles get a badge and are shown as more trustworthy in Discovery.",
  },
  {
    q: "What are Duo Coins and Premium?",
    a: "Coins are Duo's in-app currency, purchasable via eSewa from your Wallet. You can spend them on Premium features like seeing who liked you and boosting your profile.",
  },
  {
    q: "How do I stay safe while dating?",
    a: "Meet in public places for first dates, tell a friend where you're going, and never send money to someone you haven't met in person. Report or block anyone who makes you uncomfortable — you can do both from any chat.",
  },
  {
    q: "Can I control who sees my location?",
    a: "Yes. Go to Settings > Location privacy to enable Ghost mode or limit who can see you on the map.",
  },
  {
    q: "How do I turn on two-factor authentication?",
    a: "Go to Settings > Two-factor authentication and choose an authenticator app or email codes. We'll also give you backup codes in case you lose access to your device.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings > Delete account. This deactivates your profile immediately and signs you out of every device. Contact support if you'd like your data permanently erased.",
  },
  {
    q: "I found a bug — what should I do?",
    a: "Use Settings > Report a bug and describe what happened. Include what you were doing right before it occurred — that helps us fix it faster.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
      >
        <span className="font-semibold text-on-surface">{q}</span>
        <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open ? (
        <p className="px-4 pb-4 text-sm leading-relaxed text-on-surface-variant md:px-5">{a}</p>
      ) : null}
    </div>
  );
}

export function FaqPage() {
  return (
    <SecurityPageShell title="FAQ" backHref="/help">
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={item.q}>
            {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
            <FaqItem q={item.q} a={item.a} />
          </div>
        ))}
      </div>
    </SecurityPageShell>
  );
}
