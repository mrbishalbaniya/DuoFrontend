"use client";

import { useEffect, useState } from "react";
import { fetchAddress, googleMapsUrl } from "@/lib/chatLocation";
import { LocationMessageCard } from "./LocationMessageCard";

/** Shows the found location and asks before it's sent to the chat. */
export function LocationConfirmDialog({
  lat,
  lng,
  recipientName,
  sending,
  onConfirm,
  onCancel,
}: {
  lat: number;
  lng: number;
  recipientName?: string;
  sending: boolean;
  onConfirm: (address: string | null) => void;
  onCancel: () => void;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchAddress(lat, lng, ctrl.signal).then((a) => {
      if (ctrl.signal.aborted) return;
      setAddress(a);
      setLookupDone(true);
    });
    return () => ctrl.abort();
  }, [lat, lng]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-location-title"
        className="w-full max-w-sm rounded-3xl border border-outline-variant/40 bg-background p-5 text-on-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <span className="material-symbols-outlined">share_location</span>
          </span>
          <div>
            <h2 id="share-location-title" className="text-lg font-semibold leading-tight">
              Share your location?
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {recipientName ? `${recipientName} will` : "They will"} see this spot and can open it in
              Google Maps.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <LocationMessageCard
            location={{ lat, lng, url: googleMapsUrl(lat, lng), address: address ?? undefined }}
            mine
            addressLoading={!lookupDone}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="h-11 rounded-full bg-secondary text-sm font-semibold transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(address)}
            disabled={sending}
            autoFocus
            className="flex h-11 items-center justify-center gap-1.5 rounded-full gradient-brand-br text-sm font-semibold text-white shadow-lg shadow-primary/20 transition active:scale-95 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
