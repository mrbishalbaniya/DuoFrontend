"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DashboardMenuSheet } from "@/components/dashboard/DashboardMenuSheet";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/match", label: "Match" },
  { href: "/discover", label: "Discover" },
  { href: "/chat", label: "Chat" },
  { href: "/map", label: "Map" },
];

function getGreetingName(fullName?: string | null, username?: string | null) {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed.split(/\s+/)[0];
  return username || "there";
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);

  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    if (userMenuOpen) {
      setUserMenuOpen(false);
    }
  }

  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const greetingName = getGreetingName(user?.profile?.full_name, user?.username);

  return (
    <>
      <header className="premium-nav fixed top-0 z-50 w-full">
        <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-surface-container text-primary active:scale-95 md:hidden"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <Logo solid={pathname === "/"} />
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-[var(--font-headline)] text-sm font-bold tracking-tight transition-colors ${
                  pathname === link.href
                    ? "text-primary-container"
                    : "text-on-surface-variant hover:text-primary-container"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  type="button"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-primary/15 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-high"
                >
                  <span className="truncate">Hello, {greetingName}</span>
                  <span
                    className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11rem] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high py-1 shadow-[0_16px_40px] shadow-black/25"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container ${
                        pathname === "/profile"
                          ? "text-primary-container"
                          : "text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex rounded-full px-4 py-1.5 font-[var(--font-headline)] text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95 sm:px-6 sm:py-2 sm:text-sm ${
                  pathname === "/"
                    ? "bg-primary hover:bg-primary/90"
                    : "gradient-brand-br"
                }`}
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>
      <DashboardMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
