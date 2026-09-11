import { notFound } from "next/navigation";
import { WalletTransactionDetailPage } from "@/components/wallet/WalletTransactionDetailPage";

export default async function WalletTransactionDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transactionId = Number(id);
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    notFound();
  }

  return <WalletTransactionDetailPage transactionId={transactionId} />;
}
