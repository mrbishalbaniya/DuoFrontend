"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

type MenuItem = {
  href?: string;
  icon: string;
  label: string;
  description?: string;
  onClick?: () => void;
  accent?: boolean;
};

interface DashboardMenuSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenFilters?: () => void;
}

export function DashboardMenuSheet({ open, onClose, onOpenFilters }: DashboardMenuSheetProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const items: MenuItem[] = [
    { href: "/", icon: "home", label: "Home", description: "Landing page" },
    { href: "/match", icon: "favorite", label: "Match", description: "Swipe and like profiles" },
    { href: "/discover", icon: "group", label: "Discover", description: "Your matched profiles" },
    { href: "/chat", icon: "chat_bubble", label: "Messages", description: "Chat with matches" },
    { href: "/map", icon: "map", label: "Map", description: "Find people nearby" },
    { href: "/profile", icon: "person", label: "My profile", description: "View and edit profile" },
    { href: "/insights", icon: "insights", label: "Insights", description: "Compatibility tips" },
    {
      icon: "tune",
      label: "Discovery filters",
      description: "Age, distance, preferences",
      onClick: () => {
        onClose();
        onOpenFilters?.();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[110]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-menu-title"
        className="ios-sheet absolute inset-x-0 bottom-0 z-[111] mx-auto flex h-[min(78dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col items-center border-b border-white/[0.08] px-4 pb-3 pt-2">
          <div className="mb-3 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[17px] font-normal text-primary active:opacity-70"
            >
              Close
            </button>
            <h2 id="dashboard-menu-title" className="text-[17px] font-semibold text-on-surface">
              Menu
            </h2>
            <span className="w-[46px]" aria-hidden />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
          <div className="space-y-4 px-4 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {user ? (
              <div className="rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
                <p className="text-sm font-semibold text-on-surface">
                  {user.profile?.full_name || user.username}
                </p>
                <p className="text-xs text-on-surface-variant">{user.email}</p>
              </div>
            ) : null}

            <div className="ios-inset-group">
              {items.map((item, index) => {
                const content = (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl text-primary">{item.icon}</span>
                      <div>
                        <p className="text-[16px] font-medium text-on-surface">{item.label}</p>
                        {item.description ? (
                          <p className="text-[13px] text-on-surface-variant">{item.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-lg text-on-surface-variant/50">
                      chevron_right
                    </span>
                  </>
                );

                const rowClassName = `ios-filter-row w-full text-left transition-colors active:bg-white/[0.04] ${
                  index < items.length - 1 ? "border-b border-white/[0.06]" : ""
                }`;

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={rowClassName}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={rowClassName}
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                  router.push("/login");
                }}
                className="w-full rounded-xl border border-error/20 bg-error/10 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/15"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full gradient-brand py-3 text-sm font-bold text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
