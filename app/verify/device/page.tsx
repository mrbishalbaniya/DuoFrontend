"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { VerificationFlow } from "@/components/verification/VerificationFlow";

function VerifyDeviceContent() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("session");

  if (!sessionToken) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <span className="material-symbols-outlined mb-2 text-4xl text-red-500">link_off</span>
          <h1 className="font-[var(--font-headline)] text-xl font-bold text-on-surface">
            Invalid verification link
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Scan the QR code or open the link from your other device again.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl px-6 py-3 font-bold text-white gradient-brand"
          >
            Go to Duo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-surface" data-lenis-prevent>
      <header className="flex shrink-0 items-center gap-3 border-b border-primary/10 px-4 py-3">
        <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">
          Verify on this device
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden" data-lenis-prevent>
        <VerificationFlow mode="device" initialSessionToken={sessionToken} />
      </div>
    </div>
  );
}

export default function VerifyDevicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-surface">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <VerifyDeviceContent />
    </Suspense>
  );
}
