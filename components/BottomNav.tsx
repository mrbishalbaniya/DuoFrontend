"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

const navLeft: NavItem[] = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/chat", icon: "chat_bubble", label: "Chats" },
];

const navCenter: NavItem = {
  href: "/dashboard",
  icon: "favorite",
  label: "Match",
};

const navRight: NavItem[] = [
  { href: "/map", icon: "map", label: "Map" },
  { href: "/profile", icon: "person", label: "Profile" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/match";
  }
  if (href === "/chat") {
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }
  return pathname === href;
}

const filledIconStyle: CSSProperties = { fontVariationSettings: "'FILL' 1" };

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 transition-all duration-300 active:scale-95 sm:px-2 ${
        isActive
          ? "text-primary"
          : "text-on-surface-variant hover:bg-surface-variant/80 hover:text-on-surface"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[22px] ${isActive ? "text-primary" : ""}`}
        style={isActive ? filledIconStyle : undefined}
      >
        {item.icon}
      </span>
      <span
        className={`max-w-full truncate text-[10px] font-semibold leading-tight ${
          isActive ? "text-primary" : "text-on-surface-variant"
        }`}
      >
        {item.label}
      </span>
      {isActive ? (
        <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden />
      ) : null}
    </Link>
  );
}

function CenterNavLink({ pathname }: { pathname: string }) {
  const isActive = isNavActive(pathname, navCenter.href);

  return (
    <Link
      href={navCenter.href}
      aria-label={navCenter.label}
      aria-current={isActive ? "page" : undefined}
      className={`relative -mt-7 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-95 ${
        isActive
          ? "gradient-brand-br border-white text-white shadow-[0_12px_32px] shadow-primary/35"
          : "border-outline-variant/40 bg-surface text-primary shadow-[0_8px_24px] shadow-primary/15 hover:border-primary/30"
      }`}
    >
      <span
        className="material-symbols-outlined text-[28px]"
        style={isActive ? filledIconStyle : undefined}
      >
        {navCenter.icon}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Main navigation"
    >
      <div className="flex w-full max-w-md items-end justify-between gap-1 rounded-[2.2rem] border border-outline-variant/35 bg-background/92 px-2 py-2 shadow-[0_16px_40px] shadow-primary/12 backdrop-blur-xl">
        <div className="flex min-w-0 flex-1 items-end justify-around">
          {navLeft.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <CenterNavLink pathname={pathname} />

        <div className="flex min-w-0 flex-1 items-end justify-around">
          {navRight.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}
