// Utility functions for currency and number formatting

/** Currencies a gift's price can be entered in. Every stored price has one (default USD). */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'RUB'] as const
export type Currency = (typeof CURRENCIES)[number]

export function isCurrency(value: unknown): value is Currency {
  return (CURRENCIES as readonly unknown[]).includes(value)
}

const SYMBOLS: Record<string, Currency> = { $: 'USD', '£': 'GBP', '€': 'EUR', '₽': 'RUB' }

/** Reads a price as shops and people write it: "29.99 GBP", "£1,299.99", "12,50", "around 40". */
function readPrice(text: string) {
  const raw = text.trim()
  const codeMatch = raw.match(/\b[A-Z]{3}\b/)?.[0]
  const code = isCurrency(codeMatch) ? codeMatch : null
  const symbolChar = Object.keys(SYMBOLS).find((s) => raw.includes(s))
  const symbol = symbolChar ? SYMBOLS[symbolChar] : null
  const rest = raw.replace(/[$£€₽]/g, '').replace(/\b[A-Z]{3}\b/, '').trim()
  let amount: string | null = null
  if (/^\d+,\d{1,2}$/.test(rest)) amount = rest.replace(',', '.') // "12,50": decimal comma
  else if (/^\d[\d.,]*$/.test(rest)) amount = rest.replace(/,/g, '') // "1,299.99": thousands separators
  return { raw, amount, code, symbol }
}

/**
 * Splits a price as shops and link previews write it ("29.99 GBP", "£1,299.99")
 * into the amount (with a "." decimal) and, when it names a supported one, the currency.
 * An explicit code beats a symbol ("$34.99 CAD" is CAD). Text that isn't a price comes
 * back unchanged with no currency.
 */
export function parsePrice(text: string): { amount: string; currency: Currency | null } {
  const { raw, amount, code, symbol } = readPrice(text)
  if (amount === null) return { amount: raw, currency: null }
  return { amount, currency: code ?? symbol }
}

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
 * Formats a stored price in its item's currency. A currency the text itself names wins
 * (legacy rows like "29.99 GBP" were stored before items had a currency), except a bare
 * "$", which could be US, Canadian or Australian dollars.
 * @param price - The price string to parse and format
 * @param currency - The item's currency code (default: 'USD')
 * @param locale - The locale used for number formatting (default: 'en-US')
 */
export function formatPrice(price: string | number, currency: string = 'USD', locale: string = 'en-US'): string {
  if (!price) return '—';
  const { raw, amount, code, symbol } = readPrice(String(price));
  const numericPrice = amount === null ? NaN : parseFloat(amount);
  if (isNaN(numericPrice)) return raw; // not a price: show it as entered
  const named = code ?? (symbol && symbol !== 'USD' ? symbol : null);
  return formatCurrency(numericPrice, named ?? currency, locale);
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
