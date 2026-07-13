/** Duo Coin formatting — wallet balance and in-app purchases use coins; eSewa charges NPR 1:1. */

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString("en-NP")} coins`;
}

export function formatCoinDelta(amount: string | number): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  const abs = Math.abs(num).toLocaleString("en-NP");
  return num >= 0 ? `+${abs} coins` : `-${abs} coins`;
}

export function formatNprPrice(amount: number): string {
  return `NPR ${amount.toLocaleString("en-NP")}`;
}
