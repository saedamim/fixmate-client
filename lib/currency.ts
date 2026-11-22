// Prices in FixMate are US dollars (Stripe Checkout charges in USD). Numbers are shown exactly as stored.
export const CURRENCY_SYMBOL = "$";

// Service and booking prices: the stored number, unchanged (25 stays "$25")
export const usd = (amount: number | string) => `${CURRENCY_SYMBOL}${amount}`;

// Payment records: always two decimals, like a receipt ($450.50)
export const usdMoney = (amount: number) => `${CURRENCY_SYMBOL}${Number(amount).toFixed(2)}`;
