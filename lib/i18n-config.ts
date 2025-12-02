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

// Dictionary type
export type Dictionary = Record<string, any>;
