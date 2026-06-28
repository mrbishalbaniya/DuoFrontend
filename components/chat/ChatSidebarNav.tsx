"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useAuth } from "@/contexts/AuthContext";
type NavItem = {
  href: string;
  icon: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/match", icon: "favorite", label: "Match" },
  { href: "/discover", icon: "group", label: "Discover" },
  { href: "/chat", icon: "chat_bubble", label: "Chat" },
  { href: "/map", icon: "map", label: "Map" },
];

const filledIconStyle: CSSProperties = { fontVariationSettings: "'FILL' 1" };

function isNavActive(pathname: string, href: string) {
  if (href === "/match") {
    return (
      pathname === "/match" ||
      pathname === "/dashboard" ||
      pathname.startsWith("/match/celebration")
    );
  }
  if (href === "/chat") {
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }
  return pathname === href;
}

interface ChatSidebarNavProps {
  className?: string;
}

function SidebarIconButton({
  active,
  accent,
  onClick,
  href,
  icon,
  label,
}: {
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
  href?: string;
  icon: string;
  label: string;
}) {
  const className = `flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95 ${
    active
      ? accent
        ? "gradient-brand-br text-white shadow-[0_8px_20px] shadow-primary/30"
        : "bg-primary/15 text-primary"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
  }`;

  const iconEl = (
    <span
      className="material-symbols-outlined text-[24px]"
      style={active ? filledIconStyle : undefined}
    >
      {icon}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={className}
      >
        {iconEl}
      </button>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {iconEl}
    </Link>
  );
}

export function ChatSidebarNav({ className = "" }: ChatSidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav
      aria-label="Main navigation"
      className={`hidden h-full w-[4.25rem] shrink-0 flex-col items-center border-r border-outline-variant/30 bg-surface py-4 md:flex ${className}`}
    >
      <Link
        href="/"
        aria-label="Duo home"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black font-[var(--font-headline)] text-primary transition-transform active:scale-95"
      >
        D
      </Link>

      <div className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const isMatch = item.href === "/match";

          return (
            <SidebarIconButton
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              accent={active && isMatch}
            />
          );
        })}
      </div>

      <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-outline-variant/30 pt-3">
        <SidebarIconButton
          href="/profile"
          icon="person"
          label="Profile"
          active={pathname === "/profile"}
        />
        <SidebarIconButton
          href="/settings"
          icon="settings"
          label="Settings"
          active={pathname === "/settings" || pathname.startsWith("/settings/")}
        />
        <SidebarIconButton icon="logout" label="Logout" onClick={handleLogout} />
      </div>
    </nav>
  );
}
