import Link from "next/link";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <Link href="/" className={className}>
      <span className="text-2xl font-black text-gradient-brand font-[var(--font-headline)] tracking-tight">
        Duo
      </span>
    </Link>
  );
}
