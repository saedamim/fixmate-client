// All prices in FixMate are Bangladeshi Taka (BDT). The number is shown exactly as stored: no conversion, no rounding.
export const CURRENCY_SYMBOL = "৳";

export const bdt = (amount: number | string) => `${CURRENCY_SYMBOL}${amount}`;
