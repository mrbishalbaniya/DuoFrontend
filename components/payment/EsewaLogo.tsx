import Image from "next/image";

const ESEWA_ICON_URL =
  "https://cdn.esewa.com.np/ui/images/logos/esewa-icon-large.png";

interface EsewaLogoProps {
  className?: string;
}

export function EsewaLogo({ className = "h-6 w-6 shrink-0" }: EsewaLogoProps) {
  return (
    <Image
      src={ESEWA_ICON_URL}
      alt="eSewa"
      width={24}
      height={24}
      className={className}
      priority
    />
  );
}
