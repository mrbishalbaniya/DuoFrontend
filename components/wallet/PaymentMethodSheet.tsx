"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { EsewaLogo } from "@/components/payment/EsewaLogo";
import { useIsClient } from "@/lib/useIsClient";

export type PaymentMethod = "esewa" | "stripe";

export function CardIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6.5 15h4" strokeLinecap="round" />
    </svg>
  );
}

interface PaymentMethodSheetProps {
  open: boolean;
  coins: number;
  price: number;
  esewaAvailable: boolean;
  stripeAvailable: boolean;
  stripeMinAmount: number;
  formatPrice: (price: number, method: PaymentMethod) => string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
}

/** iOS-style bottom sheet for choosing how to pay for a coin pack (matches PremiumUpgradeSheet). */
export function PaymentMethodSheet({
  open,
  coins,
  price,
  esewaAvailable,
  stripeAvailable,
  stripeMinAmount,
  formatPrice,
  busy,
  onClose,
  onConfirm,
}: PaymentMethodSheetProps) {
  const t = useTranslations("wallet");
  const mounted = useIsClient();
  const stripeAllowed = stripeAvailable && price >= stripeMinAmount;
  const [method, setMethod] = useState<PaymentMethod>("esewa");

  const options: { id: PaymentMethod; enabled: boolean; shown: boolean }[] = [
    { id: "esewa", enabled: esewaAvailable, shown: esewaAvailable },
    { id: "stripe", enabled: stripeAllowed, shown: stripeAvailable },
  ];
  const selected: PaymentMethod =
    options.find((o) => o.id === method && o.enabled)?.id ?? options.find((o) => o.enabled)?.id ?? "esewa";
  const nothingAvailable = !options.some((o) => o.enabled);
  const methodLabel = (id: PaymentMethod) => (id === "esewa" ? t("payWithEsewa") : t("payWithCard"));

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  if (!mounted) return null;

  const close = () => {
    if (!busy) onClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-end transition-opacity duration-300 md:justify-center md:p-6 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={t("close")}
        onClick={close}
        tabIndex={open ? 0 : -1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-method-title"
        className={`relative z-[101] flex w-full max-w-[30rem] flex-col overflow-hidden rounded-t-[20px] border-t border-white/10 bg-background shadow-[0_-12px_48px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out md:rounded-[20px] md:border md:shadow-[0_30px_90px_rgba(0,0,0,0.45)] ${
          open ? "translate-y-0" : "translate-y-full md:translate-y-4"
        }`}
        style={{ maxHeight: "min(720px, 90dvh)" }}
      >
        <div className="flex shrink-0 justify-center bg-background pb-2 pt-3">
          <button
            type="button"
            onClick={close}
            className="h-1.5 w-12 rounded-full bg-white/20 transition-colors hover:bg-white/30"
            aria-label={t("close")}
            tabIndex={open ? 0 : -1}
          />
        </div>

        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2"
        >
          <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
            <div className="w-full text-left">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                <span aria-hidden>🪙</span>
                Duo Coins
              </div>
              <h2 id="payment-method-title" className="font-[var(--font-headline)] text-xl font-bold text-on-surface">
                {t("choosePaymentMethod")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t("choosePaymentSubtitle")}</p>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-surface-variant/30 px-4 py-3">
                <span className="flex items-center gap-1.5 text-base font-bold tabular-nums text-on-surface">
                  <span aria-hidden>🪙</span>
                  {t("coinsCount", { count: coins.toLocaleString("en-NP") })}
                </span>
                <span className="text-lg font-bold tabular-nums text-on-surface">{formatPrice(price, selected)}</span>
              </div>
            </div>

            <div className="w-full rounded-[28px] border border-white/10 bg-surface-variant/30 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              <div role="radiogroup" aria-labelledby="payment-method-title" className="flex w-full flex-col gap-3">
                {options
                  .filter((o) => o.shown)
                  .map(({ id, enabled }) => {
                    const isActive = selected === id && enabled;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        disabled={!enabled || busy}
                        tabIndex={open ? 0 : -1}
                        onClick={() => setMethod(id)}
                        className={`flex min-h-[88px] w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-colors duration-200 disabled:cursor-not-allowed ${
                          isActive
                            ? "border-primary bg-primary/[0.08]"
                            : "border-white/10 bg-background/40 hover:border-white/20 hover:bg-white/[0.04]"
                        } ${enabled ? "" : "opacity-50"}`}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3 pr-3">
                          <span
                            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                              id === "esewa" ? "bg-[#60bb46]/15" : "bg-[#635bff]/15 text-[#8b85ff]"
                            }`}
                          >
                            {id === "esewa" ? <EsewaLogo className="size-7" alt="" /> : <CardIcon className="size-6" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-base font-semibold text-on-surface md:text-lg">
                              {methodLabel(id)}
                            </span>
                            <span className="mt-0.5 block text-sm text-on-surface-variant">
                              {id === "stripe" && !enabled
                                ? t("cardMinNote", { amount: stripeMinAmount.toLocaleString("en-NP") })
                                : id === "esewa"
                                  ? t("payWithEsewaHint")
                                  : t("payWithCardHint")}
                            </span>
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 p-1 transition-colors duration-300 ${
                            isActive ? "border-primary" : "border-white/25"
                          }`}
                        >
                          <span
                            className={`size-3 rounded-full bg-primary transition-opacity duration-300 ${
                              isActive ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </span>
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={busy || nothingAvailable}
                tabIndex={open ? 0 : -1}
                onClick={() => onConfirm(selected)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary p-3 text-base font-bold text-on-primary transition active:scale-95 disabled:opacity-60"
              >
                {busy
                  ? t("redirecting")
                  : t("payButton", { price: formatPrice(price, selected), method: methodLabel(selected) })}
              </button>
              <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">{t("secureCheckoutNote")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
