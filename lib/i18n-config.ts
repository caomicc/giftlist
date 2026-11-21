// Shared i18n configuration that can be used on both client and server

export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Namespace types for translation files
export type Namespace =
  | "common"
  | "auth"
  | "gifts"
  | "lists"
  | "profile"
  | "emails"
  | "errors";

// Translation JSON, read at arbitrary depth as t.a?.b || 'fallback'. A precise type would make every
// lookup a string-or-object union that JSX can't render, so this stays loose on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dictionary = Record<string, any>;
