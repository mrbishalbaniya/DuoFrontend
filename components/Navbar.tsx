"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Matches" },
    { href: "/chat", label: "Chat" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header className="premium-nav fixed top-0 w-full z-50">
      <nav className="flex justify-between items-center px-4 sm:px-6 h-14 sm:h-16 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Logo solid={pathname === "/"} />
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-[var(--font-headline)] font-bold text-sm tracking-tight transition-colors ${
                pathname === link.href
                  ? "text-primary-container"
                  : "text-on-surface-variant hover:text-primary-container"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/insights"
            className={`font-[var(--font-headline)] font-bold text-sm tracking-tight transition-colors ${
              pathname === "/insights"
                ? "text-primary-container"
                : "text-on-surface-variant hover:text-primary-container"
            }`}
          >
            Insights
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {user ? (
            <>
              <span className="hidden md:inline text-sm font-semibold text-on-surface-variant truncate max-w-[10rem]">
                {user.profile?.full_name || user.username}
              </span>
              <button
                onClick={logout}
                className="hidden md:flex bg-surface-container text-on-surface-variant px-5 py-2 rounded-full font-[var(--font-headline)] font-bold text-sm hover:bg-surface-container-high transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`flex text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-[var(--font-headline)] font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-primary/20 ${
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
  );
}
