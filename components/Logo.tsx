import Link from "next/link";

interface LogoProps {
  className?: string;
  solid?: boolean;
}

export default function Logo({ className = "", solid = false }: LogoProps) {
  return (
    <Link href="/" className={className}>
      <span
        className={`text-2xl font-black font-[var(--font-headline)] tracking-tight ${
          solid ? "text-primary" : "text-gradient-brand"
        }`}
      >
        Duo
      </span>
    </Link>
  );
}
