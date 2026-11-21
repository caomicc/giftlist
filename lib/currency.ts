// Utility functions for currency and number formatting

/** Currencies a gift's price can be entered in. Every stored price has one (default USD). */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'RUB'] as const
export type Currency = (typeof CURRENCIES)[number]

export function isCurrency(value: unknown): value is Currency {
  return (CURRENCIES as readonly unknown[]).includes(value)
}

const SYMBOLS: Record<string, Currency> = { $: 'USD', '£': 'GBP', '€': 'EUR', '₽': 'RUB' }

/**
 * Splits a price as shops and link previews write it ("29.99 GBP", "£1,299.99")
 * into the amount and, when it names a supported one, the currency.
 * Text that isn't a price comes back unchanged with no currency.
 */
export function parsePrice(text: string): { amount: string; currency: Currency | null } {
  const raw = text.trim()
  const symbol = Object.keys(SYMBOLS).find((s) => raw.includes(s))
  const code = raw.match(/\b[A-Z]{3}\b/)?.[0]
  const currency = symbol ? SYMBOLS[symbol] : isCurrency(code) ? code : null
  const rest = raw.replace(/[$£€₽]/g, '').replace(/\b[A-Z]{3}\b/, '').trim()
  if (!/^\d[\d.,]*$/.test(rest)) return { amount: raw, currency: null }
  // "1,299.99": the commas are thousands separators. "12,50": the comma is the decimal mark.
  return { amount: rest.includes('.') ? rest.replace(/,/g, '') : rest, currency }
}

/**
 * Format a number as currency using international formatting
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale (default: 'en-US')
 */
export function formatCurrency(amount: number | string, currency: string = 'USD', locale: string = 'en-US'): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    // Malformed currency code: show the bare number rather than crash the row
    return numericAmount.toFixed(2);
  }
}

/**
 * Parse a price string and format it with international currency formatting
 * @param price - The price string to parse and format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale (default: 'en-US')
 */
export function formatPrice(price: string | number, currency: string = 'USD', locale: string = 'en-US'): string {
  if (!price) return '—';

  let priceStr = String(price).trim();

  // Remove existing currency symbols and clean the string
  priceStr = priceStr.replace(/[$€£¥₹]/g, '').replace(/,/g, '');

  const numericPrice = parseFloat(priceStr);

  if (isNaN(numericPrice)) {
    return price.toString(); // Return original if we can't parse it
  }

  return formatCurrency(numericPrice, currency, locale);
}

/**
 * Get the user's preferred locale from browser settings
 */
export function getUserLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || 'en-US';
  }
  return 'en-US';
}
