// Utility functions for currency and number formatting

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

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
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

/**
 * Get the user's preferred currency based on locale
 */
export function getUserCurrency(locale?: string): string {
  const userLocale = locale || getUserLocale();
  
  // Map common locales to currencies
  const currencyMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'de-DE': 'EUR',
    'fr-FR': 'EUR',
    'es-ES': 'EUR',
    'it-IT': 'EUR',
    'ja-JP': 'JPY',
    'ko-KR': 'KRW',
    'zh-CN': 'CNY',
    'ru-RU': 'RUB',
    'pt-BR': 'BRL',
    'in-IN': 'INR',
  };
  
  return currencyMap[userLocale] || 'USD';
}
