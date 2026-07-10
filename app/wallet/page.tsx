import { Suspense } from "react";
import { WalletPage } from "@/components/wallet/WalletPage";

function WalletFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-surface">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}

export default function WalletRoutePage() {
  return (
    <Suspense fallback={<WalletFallback />}>
      <WalletPage />
    </Suspense>
  );
}
