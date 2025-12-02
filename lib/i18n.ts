import "server-only";
import {
  locales,
  defaultLocale,
  type Locale,
  type Namespace,
  type Dictionary,
} from "./i18n-config";

// Re-export for convenience
export { locales, defaultLocale, type Locale, type Namespace, type Dictionary };

/**
 * Load translation dictionary for a given locale and namespace.
 * This runs server-side only and doesn't bloat the client bundle.
 */
export async function getDictionary(
  locale: Locale,
  namespace: Namespace
): Promise<Dictionary> {
  try {
    const dictionary = await import(
      `@/dictionaries/${locale}/${namespace}.json`
    );
    return dictionary.default;
  } catch (error) {
    console.error(
      `Failed to load dictionary: ${locale}/${namespace}.json`,
      error
    );
    // Fallback to English if translation missing
    if (locale !== defaultLocale) {
      const fallback = await import(
        `@/dictionaries/${defaultLocale}/${namespace}.json`
      );
      return fallback.default;
    }
    throw error;
  }
}

/**
 * Get all dictionaries for a locale at once (useful for pages that need multiple namespaces)
 */
export async function getAllDictionaries(locale: Locale) {
  const namespaces: Namespace[] = [
    "common",
    "auth",
    "gifts",
    "lists",
    "profile",
    "emails",
    "errors",
  ];

  const dictionaries = await Promise.all(
    namespaces.map(async (ns) => {
      const dict = await getDictionary(locale, ns);
      return [ns, dict] as const;
    })
  );

  return Object.fromEntries(dictionaries) as Record<Namespace, Dictionary>;
}

/**
 * Validate if a string is a supported locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
