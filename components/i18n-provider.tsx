"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale, Dictionary } from "@/lib/i18n-config";

interface I18nContextValue {
  locale: Locale;
  translations: Record<string, Dictionary>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  locale,
  translations,
}: {
  children: ReactNode;
  locale: Locale;
  translations: Record<string, Dictionary>;
}) {
  return (
    <I18nContext.Provider value={{ locale, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useTranslation(namespace: string) {
  const { translations, locale } = useI18n();
  return { t: translations[namespace] || {}, locale };
}

/**
 * Helper to format translation strings with placeholders
 * Example: formatMessage("Hello {{name}}", { name: "John" }) => "Hello John"
 */
export function formatMessage(
  message: string,
  values?: Record<string, string | number>
): string {
  if (!values) return message;
  
  return Object.entries(values).reduce((str, [key, value]) => {
    return str.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value));
  }, message);
}
