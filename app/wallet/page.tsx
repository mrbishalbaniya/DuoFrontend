import { Suspense } from "react";
import { WalletPage } from "@/components/wallet/WalletPage";
import Loader from "@/components/ui/loader";

function WalletFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-surface">
      <Loader pageName="Wallet" />
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
